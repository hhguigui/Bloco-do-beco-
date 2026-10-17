
"use client";

import { useState } from "react";

export default function PerfilUsuario() {
  const [editando, setEditando] = useState(true);
  const [nome, setNome] = useState("");
  const [profissao, setProfissao] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [descricao, setDescricao] = useState("");
  const [contato, setContato] = useState("");
  const [foto, setFoto] = useState("");
  const [servicos, setServicos] = useState([
    { nome: "", descricao: "", preco: "" },
  ]);
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [imagens, setImagens] = useState<string[]>([]);

  function adicionarServico() {
    setServicos([
      ...servicos,
      { nome: "", descricao: "", preco: "" },
    ]);
  }

  function atualizarServico(
    index: number,
    campo: "nome" | "descricao" | "preco",
    valor: string
  ) {
    setServicos(
      servicos.map((servico, i) =>
        i === index ? { ...servico, [campo]: valor } : servico
      )
    );
  }

  function adicionarImagem(
    event: React.ChangeEvent<HTMLInputElement>,
    tipo: "foto" | "portfolio"
  ) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    const url = URL.createObjectURL(arquivo);

    if (tipo === "foto") {
      setFoto(url);
    } else {
      setPortfolio((atual) => [...atual, url]);
      setImagens((atual) => [...atual, arquivo.name]);
    }
  }

  const campo =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-[#E8490F] focus:ring-1 focus:ring-[#E8490F]";

  const rotulo = "mb-1.5 block text-sm font-medium text-zinc-700";

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8490F] font-bold text-white">
              B
            </div>
            <div>
              <h1 className="font-bold tracking-wide">BLOCO DO BECO</h1>
              <p className="text-xs text-zinc-500">
                Seu perfil profissional
              </p>
            </div>
          </div>

          <button
            onClick={() => setEditando(!editando)}
            className="rounded-lg bg-[#E8490F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d6400d]"
          >
            {editando ? "Visualizar perfil" : "Editar perfil"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-5 py-8">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-6 text-xl font-bold">
            {editando ? "Personalize seu perfil" : "Meu perfil"}
          </h2>

          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="flex flex-col items-center gap-3 sm:w-44">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-zinc-300 bg-zinc-50">
                {foto ? (
                  <img
                    src={foto}
                    alt="Foto do perfil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm text-zinc-400">
                    Sua foto
                  </span>
                )}
              </div>

              {editando && (
                <label className="cursor-pointer text-sm font-medium text-[#E8490F]">
                  Adicionar foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => adicionarImagem(e, "foto")}
                  />
                </label>
              )}
            </div>

            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={rotulo}>Nome</label>
                {editando ? (
                  <input
                    className={campo}
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Digite seu nome"
                  />
                ) : (
                  <p>{nome || "Não informado"}</p>
                )}
              </div>

              <div>
                <label className={rotulo}>Profissão ou negócio</label>
                {editando ? (
                  <input
                    className={campo}
                    value={profissao}
                    onChange={(e) => setProfissao(e.target.value)}
                    placeholder="Ex.: Designer, eletricista..."
                  />
                ) : (
                  <p>{profissao || "Não informado"}</p>
                )}
              </div>

              <div>
                <label className={rotulo}>Cidade ou região</label>
                {editando ? (
                  <input
                    className={campo}
                    value={localizacao}
                    onChange={(e) => setLocalizacao(e.target.value)}
                    placeholder="Sua localização"
                  />
                ) : (
                  <p>{localizacao || "Não informado"}</p>
                )}
              </div>

              <div>
                <label className={rotulo}>Contato profissional</label>
                {editando ? (
                  <input
                    className={campo}
                    value={contato}
                    onChange={(e) => setContato(e.target.value)}
                    placeholder="E-mail, telefone ou outro contato"
                  />
                ) : (
                  <p>{contato || "Não informado"}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className={rotulo}>Sobre você</label>
            {editando ? (
              <textarea
                className={campo}
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Conte sobre sua experiência, habilidades e seu trabalho..."
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-zinc-600">
                {descricao || "Nenhuma descrição adicionada."}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Meus serviços</h2>

            {editando && (
              <button
                onClick={adicionarServico}
                className="rounded-lg border border-[#E8490F] px-3 py-2 text-sm font-semibold text-[#E8490F]"
              >
                + Adicionar serviço
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {servicos.map((servico, index) => (
              <div
                key={index}
                className="space-y-3 rounded-xl border border-zinc-200 p-4"
              >
                {editando ? (
                  <>
                    <input
                      className={campo}
                      value={servico.nome}
                      onChange={(e) =>
                        atualizarServico(index, "nome", e.target.value)
                      }
                      placeholder="Nome do serviço"
                    />
                    <textarea
                      className={campo}
                      rows={2}
                      value={servico.descricao}
                      onChange={(e) =>
                        atualizarServico(index, "descricao", e.target.value)
                      }
                      placeholder="Descreva o serviço"
                    />
                    <input
                      className={campo}
                      value={servico.preco}
                      onChange={(e) =>
                        atualizarServico(index, "preco", e.target.value)
                      }
                      placeholder="Preço ou 'Sob orçamento'"
                    />
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold">
                      {servico.nome || "Serviço sem nome"}
                    </h3>
                    <p className="text-sm text-zinc-600">
                      {servico.descricao || "Sem descrição"}
                    </p>
                    <p className="font-semibold text-[#E8490F]">
                      {servico.preco || "Preço não informado"}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-2 text-xl font-bold">Portfólio</h2>
          <p className="mb-5 text-sm text-zinc-500">
            Mostre fotos de trabalhos, produtos ou projetos realizados.
          </p>

          {editando && (
            <label className="inline-flex cursor-pointer items-center rounded-lg border border-dashed border-zinc-300 px-4 py-3 text-sm font-medium hover:border-[#E8490F]">
              + Adicionar imagem
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => adicionarImagem(e, "portfolio")}
              />
            </label>
          )}

          {portfolio.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {portfolio.map((imagem, index) => (
                <div key={index} className="space-y-2">
                  <img
                    src={imagem}
                    alt={`Trabalho ${index + 1}`}
                    className="h-40 w-full rounded-lg border border-zinc-200 object-cover"
                  />
                  {editando && (
                    <button
                      onClick={() => {
                        setPortfolio((atual) =>
                          atual.filter((_, i) => i !== index)
                        );
                        setImagens((atual) =>
                          atual.filter((_, i) => i !== index)
                        );
                      }}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remover imagem
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {portfolio.length === 0 && (
            <p className="mt-4 text-sm text-zinc-400">
              Nenhum trabalho adicionado.
            </p>
          )}
        </section>

        {editando && (
          <div className="flex justify-end">
            <button
              onClick={() => setEditando(false)}
              className="rounded-lg bg-[#E8490F] px-6 py-3 font-semibold text-white hover:bg-[#d6400d]"
            >
              Concluir edição
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
