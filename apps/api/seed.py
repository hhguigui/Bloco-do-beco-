"""Idempotent seed: 10 example talents in Jardim Ibirapuera. Run: cd /app/backend && python seed.py"""

import asyncio
import uuid
from datetime import date, datetime, timedelta, timezone

from lib.dates import today_iso
from lib.db import db, ensure_indexes
from models.talent import Activity, Talent

U = "?crop=entropy&cs=srgb&fm=jpg&q=80&w=800"
PHOTOS = {
    "tiao": "https://images.unsplash.com/photo-1779037805855-678303df4b94" + U,
    "jurema": "https://images.unsplash.com/photo-1637424623492-44667dea7394" + U,
    "neuza": "https://images.unsplash.com/photo-1641320197434-6ae0ca235048" + U,
    "claudia": "https://images.unsplash.com/photo-1606501126768-b78d4569d3f9" + U,
    "ze": "https://images.unsplash.com/photo-1595351298020-038700609878" + U,
    "mariana": "https://images.unsplash.com/photo-1590605095243-072811dbe64c" + U,
    "grafite1": "https://images.unsplash.com/photo-1584661156681-540e80a161d3" + U,
    "grafite2": "https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07" + U,
    "danca": "https://images.unsplash.com/photo-1522008629172-0c17aa47d1ee" + U,
    "cozinha": "https://images.unsplash.com/photo-1760907949894-b66d728e0a8e" + U,
}


TODAY = date.fromisoformat(today_iso())


def act(title, type_, desc, schedule, price="Gratuito", days=None):
    when = (TODAY + timedelta(days=days)).isoformat() if days is not None else None
    return Activity(title=title, type=type_, description=desc, schedule=schedule, price=price, date=when)


SEED = [
    dict(name="Mestre Tião do Pandeiro", category="musica", specialty="Percussão e samba de roda",
         bio="Mestre Tião toca pandeiro há mais de 30 anos nas rodas do Jardim Ibirapuera e é um dos fundadores das rodas de samba do Beco. Ensina crianças e adultos a tirar som de qualquer lata.",
         gender="homem", age_range="65+", experience="20+", address="Rua Inácio Dias da Silva, 120",
         lat=-23.6612, lng=-46.7318, phone="11 98888-1001", instagram="@mestretiao", photo=PHOTOS["tiao"],
         activities=[act("Oficina de Percussão para Crianças", "oficina", "Pandeiro, tamborim e surdo com instrumentos reciclados.", "Sábados, 10h às 12h"),
                     act("Roda de Samba do Beco", "evento", "Roda aberta com a velha guarda e convidados.", "Domingo, 16h", days=4)]),
    dict(name="Dona Jurema do Samba", category="musica", specialty="Canto e composição",
         bio="Cantora e compositora, Jurema leva o samba de raiz para escolas e praças da região. Coordena o coral comunitário do bairro.",
         gender="mulher", age_range="50-64", experience="20+", address="Rua Teresa Carreño, 45",
         lat=-23.6648, lng=-46.7352, phone="11 98888-1002", instagram="@juremadosamba", photo=PHOTOS["jurema"],
         activities=[act("Coral Vozes do Beco", "aula", "Ensaios abertos de canto coletivo para todas as idades.", "Quartas, 19h", "Contribuição voluntária")]),
    dict(name="Dona Neuza Costuras & Figurinos", category="costura", specialty="Figurinos e ajustes",
         bio="Costureira há décadas, Neuza produz os figurinos do Bloco do Beco e faz consertos e ajustes para toda a vizinhança.",
         gender="mulher", age_range="65+", experience="20+", address="Rua José Manoel Camisa Nova, 310",
         lat=-23.6671, lng=-46.7301, phone="11 98888-1003", instagram="", photo=PHOTOS["neuza"],
         activities=[act("Ajustes e consertos de roupas", "servico", "Barras, zíperes, ajustes sob medida.", "Seg. a sex., 9h às 17h", "A partir de R$ 15"),
                     act("Aula de Costura Básica", "aula", "Máquina reta, moldes simples e acabamento.", "Terças, 14h às 16h", "R$ 40/mês (valor social)")]),
    dict(name="Ateliê Retalhos do Beco", category="costura", specialty="Moda sustentável e upcycling",
         bio="Cláudia e as filhas transformam retalhos em bolsas, roupas e acessórios, gerando renda para mulheres do bairro.",
         gender="mulher", age_range="35-49", experience="5-10", address="Av. Guido Caloi, 1200",
         lat=-23.6589, lng=-46.7372, phone="11 98888-1004", instagram="@retalhosdobeco", photo=PHOTOS["claudia"],
         activities=[act("Oficina de Upcycling", "oficina", "Transforme roupas antigas em peças novas.", "Sábado, 14h", "Gratuito", days=2)]),
    dict(name="Seu Zé Cerâmica & Argila", category="artesanato", specialty="Cerâmica no torno",
         bio="Seu Zé aprendeu cerâmica com a avó no interior e hoje mantém um pequeno ateliê nos fundos de casa, aberto à comunidade.",
         gender="homem", age_range="50-64", experience="10-20", address="Rua Alfredo Ellis, 88",
         lat=-23.6690, lng=-46.7345, phone="11 98888-1005", instagram="@zeceramica", photo=PHOTOS["ze"],
         activities=[act("Curso de Cerâmica no Torno", "aula", "Turmas pequenas, material incluso.", "Quintas, 18h30", "R$ 80/mês")]),
    dict(name="Mariana Esculturas em Barro", category="artesanato", specialty="Escultura e modelagem",
         bio="Jovem artesã que modela figuras inspiradas na cultura afro-brasileira e nas personagens do bairro.",
         gender="mulher", age_range="25-34", experience="2-5", address="Rua Sebastião Fernandes, 52",
         lat=-23.6625, lng=-46.7290, phone="11 98888-1006", instagram="@marianabarro", photo=PHOTOS["mariana"],
         activities=[act("Peças sob encomenda", "servico", "Esculturas personalizadas e lembranças.", "Encomendas pelo WhatsApp", "Sob consulta")]),
    dict(name="Kaique Grafite", category="artes_visuais", specialty="Grafite e muralismo",
         bio="Grafiteiro que coloriu muitos muros do Jardim Ibirapuera com rostos de moradores e mestres da cultura local.",
         gender="homem", age_range="25-34", experience="5-10", address="Rua Inácio Dias da Silva, 400",
         lat=-23.6602, lng=-46.7340, phone="11 98888-1007", instagram="@kaiquegrafite", photo=PHOTOS["grafite1"],
         activities=[act("Oficina de Grafite para Jovens", "oficina", "Técnicas de spray, stencil e composição.", "Sextas, 15h às 17h"),
                     act("Murais sob encomenda", "servico", "Fachadas de comércios e escolas.", "Agendamento", "Sob consulta")]),
    dict(name="Coletivo Tinta Viva", category="artes_visuais", specialty="Pintura e ilustração",
         bio="Coletivo de artistas não-bináries e mulheres que realiza pinturas coletivas e exposições itinerantes no bairro.",
         gender="nao_binario", age_range="15-24", experience="<2", address="Rua Teresa Carreño, 210",
         lat=-23.6660, lng=-46.7378, phone="11 98888-1008", instagram="@tintaviva", photo=PHOTOS["grafite2"],
         activities=[act("Ateliê aberto de pintura", "oficina", "Tintas e pincéis à disposição, traga sua ideia.", "Domingo, 10h", days=0)]),
    dict(name="Cia. Passos do Beco", category="danca_teatro", specialty="Danças populares e teatro de rua",
         bio="Companhia de dança e teatro de rua que pesquisa maracatu, jongo e samba de roda, com apresentações em festas do bairro.",
         gender="mulher", age_range="35-49", experience="10-20", address="Estrada de Itapecerica, 3500",
         lat=-23.6575, lng=-46.7410, phone="11 98888-1009", instagram="@passosdobeco", photo=PHOTOS["danca"],
         activities=[act("Aula de Danças Populares", "aula", "Maracatu, jongo e ciranda para todas as idades.", "Segundas e quartas, 19h", "Gratuito"),
                     act("Espetáculo Beco em Cena", "evento", "Apresentação de teatro de rua.", "Sexta, 20h", days=12)]),
    dict(name="Tia Cida Quitutes", category="gastronomia", specialty="Culinária afro-brasileira",
         bio="Tia Cida alimenta as rodas de samba do Beco com feijoada, acarajé e doces caseiros, mantendo viva a cozinha tradicional.",
         gender="mulher", age_range="50-64", experience="10-20", address="Rua José Manoel Camisa Nova, 75",
         lat=-23.6680, lng=-46.7320, phone="11 98888-1010", instagram="@tiacidaquitutes", photo=PHOTOS["cozinha"],
         activities=[act("Encomendas de quitutes", "servico", "Salgados, doces e marmitas para eventos.", "Seg. a sáb.", "Sob consulta"),
                     act("Oficina de Culinária Ancestral", "oficina", "Receitas de família e história da comida afro-brasileira.", "Sábado, 9h", "R$ 20 (ingredientes)", days=23)]),
]


async def main() -> None:
    await ensure_indexes()
    now = datetime.now(timezone.utc)
    for i, data in enumerate(SEED):
        existing = await db.talents.find_one({"name": data["name"], "owner_id": None}, {"_id": 0, "id": 1})
        talent = Talent(
            **data,
            id=existing["id"] if existing else str(uuid.uuid4()),
            status="approved",
            created_at=now - timedelta(days=30 - i),
        )
        await db.talents.replace_one({"id": talent.id}, talent.model_dump(), upsert=True)
    # legacy rows created before the approval flow existed
    await db.talents.update_many({"status": {"$exists": False}}, {"$set": {"status": "approved"}})
    print("talents:", await db.talents.count_documents({}))


if __name__ == "__main__":
    asyncio.run(main())
