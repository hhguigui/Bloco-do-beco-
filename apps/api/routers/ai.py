import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from lib.ai import sse_response, stream_claude
from lib.auth import require_admin
from lib.db import db
from models.ai import BioRequest, RecommendRequest
from routers.talents import APPROVED, all_talents, compute_stats

router = APIRouter(prefix="/ai")

CATEGORY_LABELS = {
    "musica": "Música",
    "costura": "Costura & Moda",
    "artesanato": "Artesanato",
    "artes_visuais": "Artes Visuais & Grafite",
    "danca_teatro": "Dança & Teatro",
    "gastronomia": "Gastronomia",
    "outros": "Outros",
}


async def log_ai(kind: str, prompt: str, output: str) -> None:
    await db.ai_logs.insert_one(
        {"id": str(uuid.uuid4()), "kind": kind, "prompt": prompt, "output": output,
         "created_at": datetime.now(timezone.utc)}
    )


@router.post("/recommend")
async def recommend(payload: RecommendRequest):
    talents = await all_talents(APPROVED)
    catalog = [
        {
            "id": t.id,
            "nome": t.name,
            "categoria": CATEGORY_LABELS.get(t.category, t.category),
            "especialidade": t.specialty,
            "endereco": t.address,
            "bio": t.bio[:300],
            "atividades": [
                {"titulo": a.title, "tipo": a.type, "data": a.date, "horario": a.schedule, "valor": a.price}
                for a in t.activities
            ],
        }
        for t in talents
    ]
    system = (
        "Você é o assistente do Bloco do Beco, coletivo cultural do Jardim Ibirapuera (Zona Sul de São Paulo). "
        "Sua missão é conectar moradores aos talentos e atividades do bairro. Responda sempre em português do Brasil, "
        "de forma calorosa, curta e objetiva. Recomende SOMENTE talentos presentes no catálogo fornecido. "
        "Sempre que citar um talento, use o link markdown exatamente no formato [Nome](/talento/ID). "
        "Use **negrito** para destacar atividades, horários e valores. Recomende no máximo 3 talentos. "
        "Se nada no catálogo atender ao pedido, diga isso com gentileza e sugira a categoria mais próxima "
        "ou convide a pessoa a indicar alguém para se cadastrar. Não use títulos (#) nem tabelas."
    )
    prompt = f"Catálogo de talentos (JSON):\n{json.dumps(catalog, ensure_ascii=False)}\n\nPedido do morador: {payload.query}"
    return sse_response(stream_claude(system, prompt), lambda out: log_ai("recommend", payload.query, out))


@router.post("/bio")
async def bio(payload: BioRequest):
    system = (
        "Você escreve biografias curtas para perfis de artistas e talentos do Jardim Ibirapuera, São Paulo, "
        "publicadas no site do coletivo Bloco do Beco. Escreva em português do Brasil, em terceira pessoa, "
        "tom acolhedor e valorizando a cultura periférica, com 60 a 110 palavras, em 1 ou 2 parágrafos. "
        "Não invente prêmios, datas ou fatos que não foram informados. Responda apenas com o texto da biografia, "
        "sem título, aspas ou markdown."
    )
    prompt = (
        f"Nome: {payload.name or 'não informado'}\n"
        f"Categoria: {CATEGORY_LABELS.get(payload.category, payload.category) or 'não informada'}\n"
        f"Especialidade: {payload.specialty or 'não informada'}\n"
        f"Anotações do artista: {payload.notes}"
    )
    return sse_response(stream_claude(system, prompt), lambda out: log_ai("bio", payload.notes, out))


@router.post("/report", dependencies=[Depends(require_admin)])
async def report():
    stats = await compute_stats()
    talents = await all_talents(APPROVED)
    sample = [
        {"categoria": t.category, "especialidade": t.specialty, "atividades": [a.title for a in t.activities]}
        for t in talents[:200]
    ]
    system = (
        "Você é analista de dados culturais do coletivo Bloco do Beco (Jardim Ibirapuera, Zona Sul de SP). "
        "Escreva um relatório em português do Brasil útil para editais, prestação de contas e planejamento. "
        "Estrutura: **Resumo geral**, **Destaques por categoria**, **Perfil dos talentos** (gênero, faixa etária, "
        "tempo de atuação), **Atividades oferecidas à comunidade**, **Lacunas e recomendações**. "
        "Use os subtítulos em negrito como acima (sem #), parágrafos curtos e listas com '- '. "
        "Cite números e percentuais exatos com base nos dados. Máximo de 400 palavras."
    )
    prompt = (
        "Legendas: categorias=" + json.dumps(CATEGORY_LABELS, ensure_ascii=False)
        + "; gênero: mulher, homem, nao_binario, nao_informado; experiência em anos.\n"
        f"Estatísticas: {stats.model_dump_json()}\n"
        f"Amostra de talentos: {json.dumps(sample, ensure_ascii=False)}"
    )
    return sse_response(stream_claude(system, prompt), lambda out: log_ai("report", "report", out))
