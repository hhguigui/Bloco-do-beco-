import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/cep/{cep}")
async def lookup_cep(cep: str):
    clean = "".join(filter(str.isdigit, cep))
    if len(clean) != 8:
        raise HTTPException(status_code=400, detail="CEP inválido. Deve conter 8 dígitos.")

    url = f"https://viacep.com.br/ws/{clean}/json/"
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.get(url)
            if res.status_code != 200:
                raise HTTPException(status_code=502, detail="Erro ao consultar o serviço de CEP.")
            data = res.json()
            if data.get("erro") is True or data.get("erro") == "true":
                raise HTTPException(status_code=404, detail="CEP não encontrado.")
            return {
                "cep": data.get("cep"),
                "logradouro": data.get("logradouro", ""),
                "bairro": data.get("bairro", ""),
                "localidade": data.get("localidade", ""),
                "uf": data.get("uf", ""),
                "formatted_address": f"{data.get('logradouro', '')}, {data.get('bairro', '')} - {data.get('localidade', '')}/{data.get('uf', '')}".strip(" ,-")
            }
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Falha na consulta ao serviço ViaCEP.")


@router.get("/geocode")
async def geocode_address(q: str):
    """Return lat/lng for an address via Nominatim."""
    if not q or len(q.strip()) < 3:
        raise HTTPException(status_code=400, detail="Endereço muito curto.")
    viewbox = "-46.80,-23.62,-46.68,-23.72"
    params = {"q": f"{q.strip()}, São Paulo", "format": "json", "limit": 1, "viewbox": viewbox, "bounded": 1}
    headers = {"User-Agent": "BlocoDoBeco/1.0 (mapeamento cultural)"}
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            res = await client.get("https://nominatim.openstreetmap.org/search", params=params, headers=headers)
            data = res.json() if res.status_code == 200 else []
            if data:
                return {"lat": float(data[0]["lat"]), "lng": float(data[0]["lon"])}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Falha na geocodificação: {exc}")
    raise HTTPException(status_code=404, detail="Endereço não encontrado na região.")
