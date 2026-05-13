// ============================================================
//  ACS DIGITAL — script.js  (versão completa e melhorada)
// ============================================================
let familias = JSON.parse(localStorage.getItem("familias")) || [];
let membros  = JSON.parse(localStorage.getItem("membros"))  || [];
let visitas  = JSON.parse(localStorage.getItem("visitas"))  || [];
let tarefas  = JSON.parse(localStorage.getItem("tarefas"))  || [];

// Garante IDs nos membros
let precisaSalvar = false;
membros = membros.map(m => {
    if (!m.id) { m.id = Date.now() + Math.floor(Math.random() * 10000); precisaSalvar = true; }
    return m;
});
if (precisaSalvar) localStorage.setItem("membros", JSON.stringify(membros));

// ------------------------------------
// NAVEGAÇÃO
// ------------------------------------
function cadastrarFamilia() {
    localStorage.removeItem("editandoFamilia");
    localStorage.removeItem("editandoMembro");
    window.location.href = "familias.html";
}
function abrirFamilia(id) {
    localStorage.setItem("familiaAtual", id);
    window.location.href = "familia_detalhe.html";
}
function editarFamilia(id) {
    localStorage.setItem("editandoFamilia", id);
    localStorage.setItem("familiaAtual", id);
    window.location.href = "familias.html";
}
function voltarPagina() { window.history.back(); }

// ------------------------------------
// CONTADORES DO PAINEL
// ------------------------------------
function atualizarContadores() {
    const el = id => document.getElementById(id);
    if (el("totalFamilias"))  el("totalFamilias").innerText  = familias.length;
    if (el("totalCidadaos"))  el("totalCidadaos").innerText  = membros.length;
    if (el("totalVisitas"))   el("totalVisitas").innerText   = visitas.length;
}

// ------------------------------------
// PAINEL — BARRA DE META
// ------------------------------------
function calcularMetasEPrioridades() {
    const elPct   = document.getElementById("metaPorcentagem");
    if (!elPct) return;
    const cfg = JSON.parse(localStorage.getItem("metasConfig2")) || { metaVisitasPct: 80 };
    const hoje = new Date();
    const visitasMes = visitas.filter(v => {
        const d = new Date(v.data);
        return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear() && v.desfecho === "Visita Realizada";
    });
    const visitasAno = visitas.filter(v => {
        if (!v.data || v.desfecho !== "Visita Realizada") return false;
        return new Date(v.data).getFullYear() === hoje.getFullYear();
    });
    const famVisitadasMes = new Set(visitasMes.map(v => String(v.familiaId)));
    const famVisitadasAno = new Set(visitasAno.map(v => String(v.familiaId)));
    const nomesVisitadosMes = new Set();
    const nomesVisitadosAno = new Set();
    visitasMes.forEach(v => (v.membrosAtendidos||[]).forEach(n => nomesVisitadosMes.add(n)));
    visitasAno.forEach(v => (v.membrosAtendidos||[]).forEach(n => nomesVisitadosAno.add(n)));

    const metaFam = Math.ceil(familias.length * (cfg.metaVisitasPct / 100));
    const feitas  = famVisitadasMes.size;
    const pct     = metaFam === 0 ? 0 : Math.min(100, Math.round((feitas / metaFam) * 100));

    elPct.innerText = pct + "%";
    const elBarra  = document.getElementById("metaBarra");
    const elFrac   = document.getElementById("metaFracao");
    const elAlerta = document.getElementById("metaAlerta");
    const elProg   = document.getElementById("progressoMeta");
    if (elBarra)  { elBarra.style.width = pct + "%"; elBarra.className = "meta-barra-fill " + (pct>=80?"verde":pct>=50?"laranja":"vermelho"); }
    if (elFrac)   elFrac.innerText = `${feitas} de ${metaFam} famílias visitadas este mês`;
    if (elProg)   elProg.innerText = pct + "%";
    colorirCardMeta(pct);
    if (elAlerta) {
        if (familias.length === 0) elAlerta.innerText = "🎯 Cadastre famílias para calcular a meta!";
        else if (pct >= 100)       elAlerta.innerText = "🏆 Meta atingida! Parabéns!";
        else elAlerta.innerText = `⏳ Faltam ${Math.max(0, metaFam - feitas)} famílias para atingir a meta.`;
    }

    // ------------------------------------
    // PRIORIDADES BRASIL 360
    // ------------------------------------
    const lista = document.getElementById("listaPrioridades");
    if (!lista) return;

    // Calcula cada grupo
    const foiVisitadoMes = m => nomesVisitadosMes.has(m.nome) || famVisitadasMes.has(String(m.familia_id));
    const foiVisitadoAno = m => nomesVisitadosAno.has(m.nome) || famVisitadasAno.has(String(m.familia_id));

    const hipertensos  = membros.filter(m => m.doencas_lista?.includes("Hipertensão"));
    const diabeticos   = membros.filter(m => m.doencas_lista?.includes("Diabetes"));
    const gestantes    = membros.filter(m => m.gestante === "Sim");
    const acamados     = membros.filter(m => m.doencas_lista?.includes("Acamado"));
    const domiciliados = membros.filter(m => m.doencas_lista?.includes("Domiciliado"));
    const criancas     = membros.filter(m => {
        if (!m.nascimento) return false;
        const idade = Math.floor((hoje - new Date(m.nascimento)) / (1000*60*60*24*365.25));
        return idade < 2;
    });
    const idosos = membros.filter(m => {
        if (!m.nascimento) return false;
        const idade = Math.floor((hoje - new Date(m.nascimento)) / (1000*60*60*24*365.25));
        return idade >= 60;
    });

    const grupos = [
        { emoji:"❤️", label:"Hipertensos",       lista: hipertensos,  visitados: hipertensos.filter(foiVisitadoAno).length,  periodo:"no ano",  cor:"#e53e3e" },
        { emoji:"🩸", label:"Diabéticos",         lista: diabeticos,   visitados: diabeticos.filter(foiVisitadoAno).length,   periodo:"no ano",  cor:"#dd6b20" },
        { emoji:"🤰", label:"Gestantes",          lista: gestantes,    visitados: gestantes.filter(foiVisitadoMes).length,    periodo:"no mês",  cor:"#d53f8c" },
        { emoji:"👴", label:"Idosos (60+)",       lista: idosos,       visitados: idosos.filter(foiVisitadoAno).length,       periodo:"no ano",  cor:"#805ad5" },
        { emoji:"🛏️", label:"Acamados",          lista: acamados,     visitados: acamados.filter(foiVisitadoMes).length,     periodo:"no mês",  cor:"#2b6cb0" },
        { emoji:"🏠", label:"Domiciliados",       lista: domiciliados, visitados: domiciliados.filter(foiVisitadoMes).length, periodo:"no mês",  cor:"#2b6cb0" },
        { emoji:"👶", label:"Crianças (< 2 anos)",lista: criancas,     visitados: criancas.filter(foiVisitadoMes).length,     periodo:"no mês",  cor:"#38a169" },
    ];

    lista.innerHTML = grupos.map(g => {
        const total   = g.lista.length;
        const faltam  = Math.max(0, total - g.visitados);
        const pctG    = total === 0 ? 0 : Math.min(100, Math.round((g.visitados / total) * 100));
        const corBarra = pctG >= 80 ? "#38a169" : pctG >= 50 ? "#d69e2e" : "#e53e3e";
        const textoStatus = total === 0
            ? `<span style="color:#a0aec0;font-size:12px;">Nenhum cadastrado</span>`
            : faltam === 0
                ? `<span style="color:#22543d;font-size:12px;font-weight:bold;">✅ Todos acompanhados</span>`
                : `<span style="color:${corBarra};font-size:12px;font-weight:bold;">⚠️ Faltam ${faltam} ${g.periodo}</span>`;

        return `<li style="padding:10px 0;border-bottom:1px solid #edf2f7;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-size:14px;font-weight:600;color:#2c5282;">${g.emoji} ${g.label}</span>
                <span style="font-size:13px;color:#4a5568;">${g.visitados}/${total}</span>
            </div>
            <div style="background:#edf2f7;border-radius:999px;height:7px;overflow:hidden;margin-bottom:5px;">
                <div style="height:100%;border-radius:999px;background:${corBarra};width:${pctG}%;transition:width 0.5s;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                ${textoStatus}
                ${total > 0 ? `<button onclick="localStorage.setItem('filtroGrupo','${g.label.toLowerCase().split(' ')[0]}');window.location.href='cidadaos_lista.html'" style="background:none;border:none;color:#3182ce;font-size:12px;cursor:pointer;padding:0;">Ver lista →</button>` : ''}
            </div>
        </li>`;
    }).join('');
}

// ------------------------------------
// PAINEL — GRÁFICO DE VISITAS (novo)
// ------------------------------------
function renderizarGraficoVisitas() {
    const canvas = document.getElementById("graficoVisitasSemana");
    if (!canvas) return;

    const hoje = new Date();
    const semanas = [0,0,0,0,0];
    visitas.filter(v => {
        const d = new Date(v.data);
        return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear() && v.desfecho === "Visita Realizada";
    }).forEach(v => {
        const dia = new Date(v.data).getDate();
        const sem = Math.min(Math.floor((dia - 1) / 7), 4);
        semanas[sem]++;
    });

    // Usa devicePixelRatio para tela nítida e offsetWidth para tamanho real
    const ratio = window.devicePixelRatio || 1;
    const cw = canvas.offsetWidth;
    const ch = 160;
    canvas.width  = cw * ratio;
    canvas.height = ch * ratio;
    canvas.style.width  = cw + "px";
    canvas.style.height = ch + "px";

    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, cw, ch);

    const max   = Math.max(...semanas, 1);
    const padX  = 10;
    const padTop = 28;
    const padBot = 24;
    const totalW = cw - padX * 2;
    const barW   = totalW / 5 - 8;

    const labels = ["S1","S2","S3","S4","S5"];
    const cores  = ["#3182ce","#4299e1","#63b3ed","#90cdf4","#bee3f8"];

    semanas.forEach((val, i) => {
        const barH = val === 0 ? 0 : Math.max(4, ((val / max) * (ch - padTop - padBot)));
        const x = padX + i * (totalW / 5) + 4;
        const y = ch - padBot - barH;

        // Barra
        ctx.fillStyle = val > 0 ? cores[0] : "#edf2f7";
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, barW, Math.max(barH, 4), [4, 4, 0, 0]);
        } else {
            ctx.rect(x, y, barW, Math.max(barH, 4));
        }
        ctx.fill();

        // Label da semana (embaixo)
        ctx.fillStyle = "#718096";
        ctx.font = `${11 * (cw < 400 ? 0.9 : 1)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(labels[i], x + barW / 2, ch - 6);

        // Valor em cima da barra
        if (val > 0) {
            ctx.fillStyle = "#2c5282";
            ctx.font = "bold 12px sans-serif";
            ctx.fillText(val, x + barW / 2, y - 6);
        }
    });
}

// ------------------------------------
// PAINEL — BUSCA ATIVA
// ------------------------------------
function carregarBuscaAtiva() {
    const listaUI = document.getElementById("listaBuscaAtiva");
    if (!listaUI) return;
    const ranking = familias.map(f => {
        const vFam = visitas.filter(v => v.familiaId == f.id).sort((a,b) => new Date(b.data)-new Date(a.data));
        const ultimaData = vFam.length ? new Date(vFam[0].data) : null;
        const atraso = ultimaData ? Math.ceil(Math.abs(new Date()-ultimaData)/(1000*60*60*24)) : 999;
        return { id: f.id, nome: f.responsavel, numero: f.numeroFamilia, atraso, data: ultimaData ? ultimaData.toLocaleDateString('pt-BR') : "Nunca" };
    }).sort((a,b) => b.atraso-a.atraso).slice(0,5);
    listaUI.innerHTML = ranking.map(f => `
        <li style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #edf2f7;cursor:pointer;" onclick="abrirFamilia(${f.id})">
            <div><strong>Fam. ${f.numero} - ${f.nome}</strong><br><small style="color:#718096;">Última: ${f.data}</small></div>
            <span style="color:${f.atraso>30?'#e53e3e':'#38a169'};font-weight:bold;">${f.atraso>300?'⚠️ Nunca':f.atraso+'d'}</span>
        </li>`).join('');
}

// ------------------------------------
// PENDÊNCIAS — LISTA CONSOLIDADA (novo)
// ------------------------------------
function renderizarPendencias() {
    const container = document.getElementById("listaPendencias");
    if (!container) return;
    const filtroStatus = document.getElementById("filtroPendenciaStatus")?.value || "";
    const filtroBusca  = (document.getElementById("filtroPendenciaBusca")?.value || "").toLowerCase();

    // Coleta pendências das visitas
    const pendencias = [];
    visitas.forEach(v => {
        const checkboxes = ["pendenciaReceita","pendenciaMarcacao","pendenciaPreventivo","pendenciaEcg"];
        const labels = {"pendenciaReceita":"💊 Renovação de Receita","pendenciaMarcacao":"📅 Marcação de Consulta","pendenciaPreventivo":"🩺 Preventivo","pendenciaEcg":"❤️ Eletrocardiograma"};
        checkboxes.forEach(chk => {
            if (v[chk]) {
                pendencias.push({
                    id: `${v.id}_${chk}`,
                    visitaId: v.id,
                    cidadao: v.cidadao,
                    tipo: labels[chk],
                    detalhe: v.detalhePendencia || "",
                    data: v.data,
                    status: v[`status_${chk}`] || "aberta",
                    familiaId: v.familiaId
                });
            }
        });
        // Pendências genéricas do campo detalhe
        if (v.detalhePendencia && !checkboxes.some(c => v[c])) {
            pendencias.push({
                id: `${v.id}_detalhe`,
                visitaId: v.id,
                cidadao: v.cidadao,
                tipo: "📋 Pendência",
                detalhe: v.detalhePendencia,
                data: v.data,
                status: v.status_detalhe || "aberta",
                familiaId: v.familiaId
            });
        }
    });

    let resultado = pendencias;
    if (filtroStatus) resultado = resultado.filter(p => p.status === filtroStatus);
    if (filtroBusca)  resultado = resultado.filter(p => (p.cidadao||"").toLowerCase().includes(filtroBusca) || (p.detalhe||"").toLowerCase().includes(filtroBusca));

    const abertas   = pendencias.filter(p => p.status === "aberta").length;
    const resolvidas = pendencias.filter(p => p.status === "resolvida").length;
    const el = document.getElementById("resumoPendencias");
    if (el) el.innerHTML = `<strong>${abertas}</strong> abertas · <strong>${resolvidas}</strong> resolvidas`;

    if (resultado.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:30px;color:#718096;">${pendencias.length===0?'Nenhuma pendência registrada nas visitas.':'Nenhuma pendência encontrada com esses filtros.'}</div>`;
        return;
    }

    container.innerHTML = resultado.sort((a,b) => new Date(b.data)-new Date(a.data)).map(p => {
        const bg  = p.status === "resolvida" ? "#f0fff4" : "#fffbeb";
        const bord = p.status === "resolvida" ? "#38a169" : "#ed8936";
        return `
        <div style="background:${bg};border-left:4px solid ${bord};border-radius:6px;padding:12px 15px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
                <div>
                    <strong style="color:#2c5282;">${p.tipo}</strong>
                    <span style="font-size:12px;color:#718096;margin-left:8px;">📅 ${p.data?p.data.split('-').reverse().join('/'):'—'}</span><br>
                    <span style="font-size:13px;color:#4a5568;">👤 ${p.cidadao||'—'}</span>
                    ${p.detalhe?`<br><span style="font-size:12px;color:#718096;">📝 ${p.detalhe}</span>`:''}
                </div>
                <div style="display:flex;gap:6px;flex-shrink:0;">
                    ${p.status==='aberta'
                        ? `<button onclick="resolverPendencia('${p.id}')" style="background:#c6f6d5;color:#22543d;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;">✅ Resolver</button>`
                        : `<button onclick="reabrirPendencia('${p.id}')" style="background:#feebc8;color:#744210;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:12px;">↩ Reabrir</button>`
                    }
                    <button onclick="abrirFamilia(${p.familiaId})" style="background:#ebf8ff;color:#2b6cb0;border:1px solid #bee3f8;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:12px;">Ver família</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function resolverPendencia(composto) {
    const [visitaId, campo] = composto.split('_');
    const idx = visitas.findIndex(v => v.id == visitaId);
    if (idx !== -1) { visitas[idx][`status_${campo}`] = "resolvida"; localStorage.setItem("visitas", JSON.stringify(visitas)); }
    renderizarPendencias();
}
function reabrirPendencia(composto) {
    const [visitaId, campo] = composto.split('_');
    const idx = visitas.findIndex(v => v.id == visitaId);
    if (idx !== -1) { visitas[idx][`status_${campo}`] = "aberta"; localStorage.setItem("visitas", JSON.stringify(visitas)); }
    renderizarPendencias();
}

// ------------------------------------
// FAMÍLIAS — LISTAR COM FILTROS
// ------------------------------------
function mostrarFamilias(filtradas) {
    const lista = document.getElementById("listaFamilias");
    if (!lista) return;
    lista.innerHTML = "";
    let dados = (filtradas !== undefined ? filtradas : familias).slice().sort((a,b) => a.numeroFamilia-b.numeroFamilia);
    if (dados.length === 0) {
        lista.innerHTML = `<div style="text-align:center;padding:30px;color:#718096;">Nenhuma família encontrada.</div>`;
        return;
    }
    const hoje = new Date();
    const condicionalidades = JSON.parse(localStorage.getItem("condicionalidades")) || {};
    const vacinacao = JSON.parse(localStorage.getItem("vacinacao")) || {};

    dados.forEach(f => {
        const vFam = visitas.filter(v => v.familiaId == f.id).sort((a,b) => new Date(b.data)-new Date(a.data));
        const ultimaVisita = vFam.length ? vFam[0].data.split('-').reverse().join('/') : null;
        const diasSem = vFam.length ? Math.floor((new Date()-new Date(vFam[0].data))/(1000*60*60*24)) : 999;
        const corVisita = !ultimaVisita ? "#e53e3e" : diasSem > 30 ? "#ed8936" : "#38a169";
        const txtVisita = !ultimaVisita ? "Nunca visitada" : `Última: ${ultimaVisita} (${diasSem}d)`;
        const fotoHtml = f.fotoCasa
            ? `<img src="${f.fotoCasa}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:1px solid #cbd5e0;margin-left:10px;">`
            : `<div style="width:60px;height:60px;background:#edf2f7;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:20px;margin-left:10px;">🏠</div>`;

        // ── Bolsa Família ──
        const isBolsa = f.bolsaFamilia === "Sim";

        // ── Condicionalidades ──
        let condHtml = '';
        if (isBolsa) {
            const memFam = membros.filter(m => m.familia_id == f.id);
            const cond = condicionalidades[f.id] || {};
            let vacOk=0, vacTotal=0, pesoOk=0, pesoTotal=0, escOk=0, escTotal=0;
            memFam.forEach(m => {
                const idade = m.nascimento ? Math.floor((hoje-new Date(m.nascimento))/(1000*60*60*24*365.25)) : 99;
                if (idade < 7) {
                    vacTotal++;
                    const vac = vacinacao[m.id] || {};
                    if (["BCG","Hepatite B","Pentavalente (DTP+Hib+HepB)","VRH (Rotavírus)","Pneumo 10","Tríplice Viral (SCR)"].every(v => vac[v])) vacOk++;
                    pesoTotal++;
                    const pc = cond[`peso_${m.id}`] || {};
                    if (pc.semestre1 && pc.semestre2) pesoOk++;
                    else if (pc.semestre1 || pc.semestre2) pesoOk += 0.5;
                }
                if (idade >= 6 && idade <= 17) { escTotal++; if (cond[`escola_${m.id}`]) escOk++; }
            });
            const mkBadge = (ok, total, label, icone) => {
                if (!total) return '';
                const pct = Math.round((ok/total)*100);
                const cor = pct>=100?'#22543d':pct>=50?'#744210':'#742a2a';
                const bg  = pct>=100?'#c6f6d5':pct>=50?'#feebc8':'#fed7d7';
                return `<span title="${label}: ${ok}/${total}" style="font-size:11px;background:${bg};color:${cor};padding:2px 7px;border-radius:4px;font-weight:bold;cursor:pointer;" onclick="event.stopPropagation();abrirCondicionalidadesFamilia(${f.id})">${icone} ${Math.floor(ok)}/${total}</span>`;
            };
            const badges = [mkBadge(vacOk,vacTotal,"Vacinas","💉"), mkBadge(pesoOk,pesoTotal,"Peso/Altura","⚖️"), mkBadge(escOk,escTotal,"Frequência escolar","🏫")].filter(Boolean).join(' ');
            if (badges || memFam.length > 0) {
                condHtml = `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;align-items:center;">
                    <span style="font-size:11px;color:#744210;font-weight:600;">Condicionalidades:</span>
                    ${badges || '<span style="font-size:11px;color:#a0aec0;">Sem crianças/adolescentes</span>'}
                    <button onclick="event.stopPropagation();abrirCondicionalidadesFamilia(${f.id})" style="font-size:11px;background:#fffbeb;color:#744210;border:1px solid #f6ad55;padding:2px 8px;border-radius:4px;cursor:pointer;">✏️ Atualizar</button>
                </div>`;
            }
        }

        lista.innerHTML += `
        <div class="box" style="margin-bottom:10px;border-left:4px solid ${isBolsa?'#d69e2e':'#3182ce'};padding:15px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="flex:1;cursor:pointer;" onclick="abrirFamilia(${f.id})">
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:2px;">
                        <strong style="font-size:16px;color:#1a365d;">Família ${f.numeroFamilia} — ${f.responsavel}</strong>
                        ${isBolsa?`<span style="background:#f6e05e;color:#744210;font-size:11px;font-weight:bold;padding:2px 8px;border-radius:4px;">💰 Bolsa Família</span>`:''}
                    </div>
                    <span style="color:#718096;font-size:13px;">📍 ${f.logradouro||'—'}, ${f.numero||'S/N'}</span><br>
                    ${f.numeroProntuario?`<span style="font-size:12px;color:#4a5568;">📋 Prontuário: <strong>${f.numeroProntuario}</strong></span><br>`:''}
                    <span style="font-size:12px;color:${corVisita};font-weight:bold;">🕐 ${txtVisita}</span>
                    ${condHtml}
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
                    ${fotoHtml}
                    <div style="display:flex;gap:6px;margin-top:6px;">
                        <button onclick="editarFamilia(${f.id})" style="background:#ebf8ff;color:#2b6cb0;border:1px solid #bee3f8;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:12px;">✏️ Editar</button>
                        <button onclick="excluirFamilia(${f.id})" style="background:#fff5f5;color:#c53030;border:1px solid #fed7d7;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:12px;">🗑️</button>
                    </div>
                </div>
            </div>
        </div>`;
    });
}

function excluirFamilia(id) {
    if (!confirm("Excluir esta família e todos os seus membros? Esta ação não pode ser desfeita.")) return;
    familias = familias.filter(f => f.id != id);
    membros  = membros.filter(m => m.familia_id != id);
    localStorage.setItem("familias", JSON.stringify(familias));
    localStorage.setItem("membros",  JSON.stringify(membros));
    filtrarFamilias();
}

function filtrarFamilias() {
    const texto  = (document.getElementById("filtroTextoFam")?.value||"").toLowerCase();
    const rua    = (document.getElementById("filtroRuaFam")?.value||"").toLowerCase();
    const cond   = document.getElementById("filtroCondFam")?.value||"";
    const visita = document.getElementById("filtroVisitaFam")?.value||"";
    const hoje   = new Date();
    let resultado = familias.filter(f => {
        const memFam = membros.filter(m => m.familia_id==f.id);
        const vFam   = visitas.filter(v => v.familiaId==f.id).sort((a,b)=>new Date(b.data)-new Date(a.data));
        const ultima = vFam.length ? new Date(vFam[0].data) : null;
        const dias   = ultima ? Math.floor((hoje-ultima)/(1000*60*60*24)) : 9999;
        if (texto && !String(f.numeroFamilia).includes(texto) && !(f.responsavel||"").toLowerCase().includes(texto)) return false;
        if (rua   && !(f.logradouro||"").toLowerCase().includes(rua)) return false;
        if (cond) {
            const tem = memFam.some(m => {
                if (cond==="hipertensao") return m.doencas_lista?.includes("Hipertensão");
                if (cond==="diabetes")    return m.doencas_lista?.includes("Diabetes");
                if (cond==="gestante")    return m.gestante==="Sim";
                if (cond==="idoso") { if (!m.nascimento) return false; return Math.floor((hoje-new Date(m.nascimento))/(1000*60*60*24*365.25))>=60; }
                return false;
            });
            if (!tem) return false;
        }
        if (visita==="nunca"  && ultima!==null)           return false;
        if (visita==="30dias" && (!ultima||dias<=30))     return false;
        if (visita==="ok"     && dias>30)                 return false;
        return true;
    });
    const contador = document.getElementById("contadorFamilias");
    if (contador) contador.textContent = `Exibindo ${resultado.length} de ${familias.length} famílias`;
    mostrarFamilias(resultado);
}

function limparFiltrosFam() {
    ["filtroTextoFam","filtroRuaFam"].forEach(id=>{const e=document.getElementById(id);if(e)e.value="";});
    ["filtroCondFam","filtroVisitaFam"].forEach(id=>{const e=document.getElementById(id);if(e)e.value="";});
    filtrarFamilias();
}

// ------------------------------------
// SALVAR FAMÍLIA (com edição)
// ------------------------------------
const formCadastro = document.getElementById("formCadastro");
if (formCadastro) {
    // Pré-preenche se estiver editando
    const idEd = localStorage.getItem("editandoFamilia");
    if (idEd) {
        const fEd = familias.find(f=>f.id==idEd);
        if (fEd) {
            const set = (id, val) => { const e=document.getElementById(id); if(e) e.value=val||""; };
            set("numeroFamilia",    fEd.numeroFamilia);
            set("numeroProntuario", fEd.numeroProntuario);
            set("dataCadastro",     fEd.dataCadastro);
            set("responsavel",   fEd.responsavel);
            set("telefone",      fEd.telefone);
            set("moradores",     fEd.moradores);
            set("logradouro",    fEd.logradouro);
            set("numero",        fEd.numero);
            set("bairro",        fEd.bairro);
            set("situacao",      fEd.situacao);
            set("tipoDomicilio", fEd.tipoDomicilio);
            set("animais",       fEd.animais);
            set("observacoes",   fEd.observacoes);
            
            // Marca Bolsa Familia
            if (fEd.bolsaFamilia) {
                const rBolsa = document.querySelector(`input[name="bolsaFamilia"][value="${fEd.bolsaFamilia}"]`);
                if (rBolsa) rBolsa.checked = true;
            }

            if (fEd.localizacao) {
                const r = document.querySelector(`input[name="localizacao"][value="${fEd.localizacao}"]`);
                if (r) r.checked = true;
            }
            if (fEd.fotoCasa) {
                window._fotoFamiliaBase64 = fEd.fotoCasa;
                const prev = document.getElementById("previewFotoFamilia");
                if (prev) { prev.src=fEd.fotoCasa; prev.style.display="block"; }
            }
            const h1 = document.querySelector(".page-title");
            if (h1) h1.textContent = "EDITAR FAMÍLIA";
            document.getElementById("secaoMembros").style.display = "block";
            renderizarMembrosSalvos();
        }
    }

    formCadastro.addEventListener("submit", function(e) {
        e.preventDefault();
        const locChecked = document.querySelector('input[name="localizacao"]:checked');
        const bolsaChecked = document.querySelector('input[name="bolsaFamilia"]:checked');

        const dadosFamilia = {
            numeroFamilia:    document.getElementById("numeroFamilia").value,
            numeroProntuario: document.getElementById("numeroProntuario")?.value || "",
            dataCadastro:     document.getElementById("dataCadastro").value,
            responsavel:      document.getElementById("responsavel").value,
            telefone:         document.getElementById("telefone").value,
            moradores:        document.getElementById("moradores").value,
            logradouro:       document.getElementById("logradouro").value,
            numero:           document.getElementById("numero").value,
            bairro:           document.getElementById("bairro").value,
            situacao:         document.getElementById("situacao").value,
            tipoDomicilio:    document.getElementById("tipoDomicilio").value,
            localizacao:      locChecked ? locChecked.value : '',
            bolsaFamilia:     bolsaChecked ? bolsaChecked.value : 'Não',
            animais:          document.getElementById("animais").value,
            observacoes:      document.getElementById("observacoes").value,
            fotoCasa:         window._fotoFamiliaBase64
        };
        const idEdicao = localStorage.getItem("editandoFamilia");
        if (idEdicao) {
            const idx = familias.findIndex(f=>f.id==idEdicao);
            if (idx!==-1) familias[idx] = {...familias[idx], ...dadosFamilia};
            localStorage.removeItem("editandoFamilia");
        } else {
            dadosFamilia.id = Date.now();
            familias.push(dadosFamilia);
            localStorage.setItem("familiaAtual", dadosFamilia.id);
        }
        localStorage.setItem("familias", JSON.stringify(familias));
        window._fotoFamiliaBase64 = null;
        showToast("✅ Família salva com sucesso!", "verde");
        document.getElementById("secaoMembros").style.display = "block";
        renderizarMembrosSalvos();
    });
}

// ------------------------------------
// MEMBROS — SALVAR, EDITAR, EXCLUIR
// ------------------------------------
const formMembro = document.getElementById("formMembro");
if (formMembro) {

    // ── Lista de todos os campos do formulário ──
    const CAMPOS_MEMBRO = [
        "nomeMembro","cnsMembro","cpfMembro","prontuarioMembro","nascimentoMembro","sexoMembro",
        "racaMembro","maeMembro","paiMembro","nacionalidadeMembro","municipioNascMembro",
        "ufNascMembro","celularMembro","parentescoMembro","ocupacaoMembro","escolaMembro",
        "escolaridadeMembro","mercadoTrabalhoMembro","orientacaoMembro","generoMembro",
        "deficienciaMembro","gestanteMembro","pesoMembro","fumaMembro","alcoolMembro",
        "drogasMembro","internacaoMembro","causaInternacaoMembro","outrasCondicoesMembro"
    ];

    // ── Salva rascunho no localStorage ──
    function salvarRascunhoMembro() {
        const rascunho = {};
        CAMPOS_MEMBRO.forEach(id => {
            const el = document.getElementById(id);
            if (el) rascunho[id] = el.value;
        });
        // Salva checkboxes de doenças
        const doencas = Array.from(document.querySelectorAll('#formMembro input[type="checkbox"]:checked')).map(c=>c.value);
        rascunho._doencas = doencas;
        rascunho._editandoId = formMembro.dataset.editandoMembro || "";
        rascunho._timestamp = Date.now();
        localStorage.setItem("rascunhoMembro", JSON.stringify(rascunho));
        atualizarIndicadorRascunho(true);
    }

    // ── Restaura rascunho ──
    function restaurarRascunhoMembro() {
        const salvo = JSON.parse(localStorage.getItem("rascunhoMembro"));
        if (!salvo) return;

        // Só restaura se tiver nome preenchido e for recente (menos de 24h)
        const idadeHoras = (Date.now() - salvo._timestamp) / (1000 * 60 * 60);
        if (!salvo.nomeMembro || idadeHoras > 24) {
            localStorage.removeItem("rascunhoMembro");
            return;
        }

        CAMPOS_MEMBRO.forEach(id => {
            const el = document.getElementById(id);
            if (el && salvo[id] !== undefined) el.value = salvo[id];
        });

        // Restaura checkboxes
        if (salvo._doencas && salvo._doencas.length > 0) {
            document.querySelectorAll('#formMembro input[type="checkbox"]').forEach(c => {
                c.checked = salvo._doencas.includes(c.value);
            });
        }

        if (salvo._editandoId) {
            formMembro.dataset.editandoMembro = salvo._editandoId;
            const btnSubmit = document.querySelector('#formMembro button[type="submit"]');
            if (btnSubmit) btnSubmit.textContent = "💾 Salvar Alterações";
        }

        atualizarIndicadorRascunho(true);
        mostrarAvisoDRascunho(salvo._timestamp);
    }

    // ── Limpa rascunho ──
    function limparRascunhoMembro() {
        localStorage.removeItem("rascunhoMembro");
        atualizarIndicadorRascunho(false);
        const aviso = document.getElementById("avisoDRascunho");
        if (aviso) aviso.remove();
    }

    // ── Indicador visual de rascunho salvo ──
    function atualizarIndicadorRascunho(temRascunho) {
        let ind = document.getElementById("indicadorRascunho");
        if (!ind) {
            ind = document.createElement("div");
            ind.id = "indicadorRascunho";
            ind.style.cssText = "font-size:12px;color:#718096;text-align:right;margin-bottom:8px;padding:4px 8px;border-radius:4px;transition:all 0.3s;";
            formMembro.insertBefore(ind, formMembro.firstChild);
        }
        if (temRascunho) {
            const agora = new Date().toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
            ind.innerHTML = `💾 Rascunho salvo automaticamente às ${agora} &nbsp;·&nbsp; <a onclick="descartarRascunho()" style="color:#e53e3e;cursor:pointer;text-decoration:none;">🗑️ Descartar</a>`;
            ind.style.background = "#f0fff4";
            ind.style.color = "#22543d";
            ind.style.border = "1px solid #c6f6d5";
        } else {
            ind.innerHTML = "";
            ind.style.background = "none";
            ind.style.border = "none";
        }
    }

    // ── Aviso de rascunho encontrado ──
    function mostrarAvisoDRascunho(timestamp) {
        if (document.getElementById("avisoDRascunho")) return;
        const tempoStr = new Date(timestamp).toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
        const div = document.createElement("div");
        div.id = "avisoDRascunho";
        div.style.cssText = "background:#fffbeb;border:1px solid #f6ad55;border-left:4px solid #ed8936;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#744210;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;";
        div.innerHTML = `
            <span>📋 <strong>Rascunho encontrado</strong> — preenchido em ${tempoStr}. Os dados foram restaurados.</span>
            <div style="display:flex;gap:8px;">
                <button onclick="document.getElementById('avisoDRascunho').remove()" style="background:#feebc8;color:#744210;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;">✓ OK, continuar</button>
                <button onclick="descartarRascunho()" style="background:#fed7d7;color:#c53030;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;">🗑️ Descartar</button>
            </div>`;
        formMembro.parentElement.insertBefore(div, formMembro);
    }

    // ── Escuta mudanças em todos os campos (debounce 1s) ──
    let _rascunhoTimer = null;
    function agendarSalvarRascunho() {
        clearTimeout(_rascunhoTimer);
        _rascunhoTimer = setTimeout(salvarRascunhoMembro, 1000);
    }

    CAMPOS_MEMBRO.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input",  agendarSalvarRascunho);
        if (el) el.addEventListener("change", agendarSalvarRascunho);
    });

    // Escuta checkboxes também
    document.querySelectorAll('#formMembro input[type="checkbox"]').forEach(c => {
        c.addEventListener("change", agendarSalvarRascunho);
    });

    // ── Restaura ao abrir a página ──
    restaurarRascunhoMembro();

    formMembro.addEventListener("submit", function(e) {
        e.preventDefault();
        const familiaId = localStorage.getItem("familiaAtual");
        if (!familiaId) { alert("Salve a família primeiro!"); return; }
        const doencas = Array.from(document.querySelectorAll('#formMembro input[type="checkbox"]:checked')).map(c=>c.value);
        const editId  = formMembro.dataset.editandoMembro;
        
        const membro  = {
            id:             editId ? parseInt(editId) : Date.now(),
            familia_id:     familiaId,
            nome:           document.getElementById("nomeMembro").value,
            cns:            document.getElementById("cnsMembro").value,
            cpf:            document.getElementById("cpfMembro").value,
            prontuario:     document.getElementById("prontuarioMembro")?.value || "",
            nascimento:     document.getElementById("nascimentoMembro").value,
            sexo:           document.getElementById("sexoMembro").value,
            raca:           document.getElementById("racaMembro").value,
            mae:            document.getElementById("maeMembro").value,
            pai:            document.getElementById("paiMembro").value,
            nacionalidade:  document.getElementById("nacionalidadeMembro").value,
            municipioNasc:  document.getElementById("municipioNascMembro").value,
            ufNasc:         document.getElementById("ufNascMembro").value,
            celular:        document.getElementById("celularMembro").value,
            parentesco:     document.getElementById("parentescoMembro").value,
            ocupacao:       document.getElementById("ocupacaoMembro").value,
            escola:         document.getElementById("escolaMembro").value,
            escolaridade:   document.getElementById("escolaridadeMembro").value,
            mercadoTrabalho:document.getElementById("mercadoTrabalhoMembro").value,
            orientacao:     document.getElementById("orientacaoMembro").value,
            genero:         document.getElementById("generoMembro").value,
            deficiencia:    document.getElementById("deficienciaMembro").value,
            gestante:       document.getElementById("gestanteMembro").value,
            peso:           document.getElementById("pesoMembro").value,
            pesoKg:         document.getElementById("pesoKgMembro")?.value||"",
            alturaCm:       document.getElementById("alturaCmMembro")?.value||"",
            fuma:           document.getElementById("fumaMembro").value,
            alcool:         document.getElementById("alcoolMembro").value,
            drogas:         document.getElementById("drogasMembro").value,
            doencas_lista:  doencas.join(", "),
            internacao:     document.getElementById("internacaoMembro").value,
            causaInternacao:document.getElementById("causaInternacaoMembro").value,
            outrasCondicoes:document.getElementById("outrasCondicoesMembro").value
        };
        if (editId) {
            const idx = membros.findIndex(m=>m.id==editId);
            if (idx!==-1) membros[idx] = membro;
            delete formMembro.dataset.editandoMembro;
            document.querySelector('#formMembro button[type="submit"]').textContent = "+ Adicionar Membro";
        } else {
            membros.push(membro);
        }
        localStorage.setItem("membros", JSON.stringify(membros));

        // Limpa rascunho após salvar com sucesso
        limparRascunhoMembro();

        formMembro.reset();
        renderizarMembrosSalvos();
        showToast(`✅ ${membro.nome} salvo com sucesso!`, 'verde');
    });
}

// ── Função global para descartar rascunho ──
function descartarRascunho() {
    if (!confirm("Descartar o rascunho e limpar o formulário?")) return;
    localStorage.removeItem("rascunhoMembro");
    const formMembro = document.getElementById("formMembro");
    if (formMembro) {
        formMembro.reset();
        delete formMembro.dataset.editandoMembro;
        const btnSubmit = document.querySelector('#formMembro button[type="submit"]');
        if (btnSubmit) btnSubmit.textContent = "+ Adicionar Membro";
    }
    const aviso = document.getElementById("avisoDRascunho");
    if (aviso) aviso.remove();
    const ind = document.getElementById("indicadorRascunho");
    if (ind) { ind.innerHTML = ""; ind.style.background = "none"; ind.style.border = "none"; }
}

function renderizarMembrosSalvos() {
    const lista = document.getElementById("listaMembros");
    if (!lista) return;
    const familiaId = localStorage.getItem("familiaAtual");
    const memFam = membros.filter(m=>m.familia_id==familiaId);
    if (memFam.length===0) { lista.innerHTML="<p style='color:#a0aec0;padding:10px 0;'>Nenhum membro adicionado ainda.</p>"; return; }
    lista.innerHTML = memFam.map(m=>`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border-bottom:1px solid #edf2f7;background:#f8fafc;border-radius:6px;margin-bottom:6px;">
            <div>
                <strong>👤 ${m.nome}</strong>
                <span style="font-size:12px;color:#718096;margin-left:8px;">${m.parentesco||''}</span>
                ${m.doencas_lista?`<div style="font-size:12px;color:#e53e3e;margin-top:2px;">⚠️ ${m.doencas_lista}</div>`:''}
            </div>
            <div style="display:flex;gap:6px;">
                <button onclick="editarMembro(${m.id})" style="background:#ebf8ff;color:#2b6cb0;border:1px solid #bee3f8;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:12px;">✏️</button>
                <button onclick="excluirMembro(${m.id})" style="background:#fff5f5;color:#c53030;border:1px solid #fed7d7;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:12px;">🗑️</button>
            </div>
        </div>`).join("");
}

function editarMembro(id) {
    const m = membros.find(x=>x.id===id);
    if (!m||!formMembro) return;
    const set = (elId, val) => { const e=document.getElementById(elId); if(e) e.value=val||""; };
    set("nomeMembro",           m.nome);        set("cnsMembro",         m.cns);
    set("cpfMembro",            m.cpf);         set("nascimentoMembro",  m.nascimento);
    set("sexoMembro",           m.sexo);        set("racaMembro",        m.raca);
    set("maeMembro",            m.mae);         set("paiMembro",         m.pai);
    set("nacionalidadeMembro",  m.nacionalidade); set("municipioNascMembro", m.municipioNasc);
    set("ufNascMembro",         m.ufNasc);      set("celularMembro",     m.celular);
    set("parentescoMembro",     m.parentesco);  set("ocupacaoMembro",    m.ocupacao);
    set("escolaMembro",         m.escola);      set("escolaridadeMembro",m.escolaridade);
    set("mercadoTrabalhoMembro",m.mercadoTrabalho); set("orientacaoMembro", m.orientacao);
    set("generoMembro",         m.genero);      set("deficienciaMembro", m.deficiencia);
    set("gestanteMembro",       m.gestante);    set("pesoMembro",        m.peso);
    set("fumaMembro",           m.fuma);        set("alcoolMembro",      m.alcool);
    set("drogasMembro",         m.drogas);      set("internacaoMembro",  m.internacao);
    set("causaInternacaoMembro",m.causaInternacao); set("outrasCondicoesMembro", m.outrasCondicoes);
    document.querySelectorAll('#formMembro input[type="checkbox"]').forEach(c => {
        c.checked = m.doencas_lista?.includes(c.value)||false;
    });
    formMembro.dataset.editandoMembro = id;
    document.querySelector('#formMembro button[type="submit"]').textContent = "💾 Salvar Alterações";
    formMembro.scrollIntoView({behavior:"smooth"});
}

function excluirMembro(id) {
    if (!confirm("Excluir este membro?")) return;
    membros = membros.filter(m=>m.id!==id);
    localStorage.setItem("membros", JSON.stringify(membros));
    renderizarMembrosSalvos();
}

// ------------------------------------
// DETALHE DA FAMÍLIA
// ------------------------------------
function mostrarFamiliaDetalhe() {
    const container = document.getElementById("dadosFamilia");
    const listaVisitasUI = document.getElementById("historicoVisitasFamilia");
    if (!container) return;
    const familiaId = localStorage.getItem("familiaAtual");
    const familia = familias.find(f=>f.id==familiaId);
    if (!familia) return;
    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
            <div>
                <h2 style="color:#2c5282;">${familia.responsavel}</h2>
                <p><strong>Nº Família:</strong> ${familia.numeroFamilia} | <strong>Moradores:</strong> ${familia.moradores||'—'}</p>
                <p>📍 ${familia.logradouro||'—'}, ${familia.numero||'S/N'} - ${familia.bairro||'—'}</p>
                ${familia.telefone?`<p>📞 ${familia.telefone}</p>`:''}
                ${familia.observacoes?`<p style="color:#718096;font-size:13px;">📝 ${familia.observacoes}</p>`:''}
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;">
                ${familia.fotoCasa?`<img src="${familia.fotoCasa}" style="width:120px;border-radius:8px;border:1px solid #e2e8f0;">`:''}
                <button onclick="editarFamilia(${familia.id})" style="background:#2b6cb0;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:bold;">✏️ Editar família</button>
            </div>
        </div>`;
    if (listaVisitasUI) {
        const historico = visitas.filter(v=>v.familiaId==familiaId).sort((a,b)=>new Date(b.data)-new Date(a.data));
        listaVisitasUI.innerHTML = historico.length ? historico.map(v=>`
            <div style="padding:12px;border-bottom:1px solid #edf2f7;background:#f8fafc;border-radius:6px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
                    <strong>📅 ${v.data?v.data.split('-').reverse().join('/'):'—'} · ${v.turno||''}</strong>
                    <span style="color:${v.desfecho?.includes('Realizada')?'#22543d':'#742a2a'};font-weight:bold;font-size:12px;background:${v.desfecho?.includes('Realizada')?'#c6f6d5':'#fed7d7'};padding:3px 8px;border-radius:4px;">${v.desfecho}</span>
                </div>
                <p style="font-size:13px;margin:6px 0 0;color:#4a5568;">📌 ${v.motivos||'—'}</p>
                ${v.info?`<p style="font-size:13px;color:#718096;margin-top:4px;">${v.info}</p>`:''}
                ${v.foto?`<img src="${v.foto}" style="max-width:100%;max-height:150px;border-radius:6px;margin-top:8px;">`:''}
                ${v.assinatura?`<div style="margin-top:8px;padding:8px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;"><span style="font-size:11px;color:#718096;display:block;margin-bottom:4px;">✍️ Assinatura do responsável</span><img src="${v.assinatura}" style="max-height:65px;border-radius:4px;background:white;"></div>`:''}
                    <button onclick="editarVisita(${v.id})" style="background:#ebf8ff;color:#2b6cb0;border:1px solid #bee3f8;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:12px;">✏️ Editar</button>
                    <button onclick="excluirVisita(${v.id})" style="background:#fff5f5;color:#c53030;border:1px solid #fed7d7;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:12px;">🗑️ Excluir</button>
                </div>
            </div>`).join('') : "<p style='color:#a0aec0;'>Nenhuma visita registrada.</p>";
    }
}

function renderizarMembrosDetalhe() {
    const lista = document.getElementById("listaMembros");
    if (!lista) return;
    const familiaId = localStorage.getItem("familiaAtual");
    const memFam = membros.filter(m=>m.familia_id==familiaId);
    if (memFam.length===0) { lista.innerHTML="<p style='color:#a0aec0;'>Nenhum membro cadastrado.</p>"; return; }
    lista.innerHTML = memFam.map(m=>{
        let idade="—";
        if (m.nascimento) { const a=Math.floor((new Date()-new Date(m.nascimento))/(1000*60*60*24*365.25)); idade=`${a} anos`; }
        return `
        <div style="padding:10px;border-bottom:1px solid #edf2f7;background:#f8fafc;border-radius:6px;margin-bottom:6px;">
            <strong>👤 ${m.nome}</strong>
            <span style="font-size:12px;color:#718096;margin-left:8px;">${m.parentesco||''} · ${m.sexo||''} · ${idade}</span>
            ${m.doencas_lista?`<div style="font-size:12px;color:#e53e3e;margin-top:2px;">⚠️ ${m.doencas_lista}</div>`:''}
            ${m.gestante==="Sim"?`<span style="font-size:12px;color:#d53f8c;margin-left:4px;">🤰 Gestante</span>`:''}
        </div>`;
    }).join("");
}

// ------------------------------------
// CIDADÃOS — LISTAR COM FILTROS
// ------------------------------------
function mostrarCidadaosGeral(filtroGrupo) {
    const container = document.getElementById("listaCidadaos");
    if (!container) return;
    const texto  = (document.getElementById("filtroTextoCid")?.value||"").toLowerCase();
    const sexo   = document.getElementById("filtroSexoCid")?.value||"";
    const cond   = filtroGrupo||document.getElementById("filtroCondCid")?.value||"";
    const idFilt = document.getElementById("filtroIdadeCid")?.value||"";
    const hoje   = new Date();
    let resultado = membros.filter(m=>{
        if (texto && !(m.nome||"").toLowerCase().includes(texto)) return false;
        if (sexo  && m.sexo!==sexo) return false;
        let idade=0;
        if (m.nascimento) idade=Math.floor((hoje-new Date(m.nascimento))/(1000*60*60*24*365.25));
        if (idFilt==="crianca" && idade>=2) return false;
        if (idFilt==="idoso"   && idade<60) return false;
        if (cond) {
            if (cond==="hipertensao" && !m.doencas_lista?.includes("Hipertensão")) return false;
            if (cond==="diabetes"    && !m.doencas_lista?.includes("Diabetes"))    return false;
            if (cond==="gestante"    && m.gestante!=="Sim")                        return false;
            if (cond==="acamado"     && !m.doencas_lista?.includes("Acamado"))     return false;
            if (cond==="domiciliado" && !m.doencas_lista?.includes("Domiciliado")) return false;
        }
        return true;
    });
    const contador = document.getElementById("contadorCidadaos");
    if (contador) contador.textContent=`Exibindo ${resultado.length} de ${membros.length} cidadãos`;
    if (resultado.length===0) {
        container.innerHTML=`<div style="text-align:center;padding:30px;color:#718096;">Nenhum cidadão encontrado.</div>`;
        return;
    }
    container.innerHTML = resultado.map(m=>{
        const fam = familias.find(f=>f.id==m.familia_id);
        const famLabel = fam?`Família ${fam.numeroFamilia} — ${fam.responsavel}`:"Família não encontrada";
        let idade="—";
        if (m.nascimento){const a=Math.floor((hoje-new Date(m.nascimento))/(1000*60*60*24*365.25));idade=`${a} anos`;}
        const tags = (m.doencas_lista||"").split(",").filter(d=>d.trim()).map(d=>`<span style="background:#ebf8ff;color:#2b6cb0;font-size:11px;padding:2px 6px;border-radius:4px;margin:2px;display:inline-block;">${d.trim()}</span>`).join("");
        const gestTag = m.gestante==="Sim"?`<span style="background:#fce7f3;color:#d53f8c;font-size:11px;padding:2px 6px;border-radius:4px;margin:2px;display:inline-block;">🤰 Gestante</span>`:'';
        return `
        <div class="box" style="margin-bottom:10px;border-left:4px solid #805ad5;padding:15px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;">
                <div>
                    <strong style="font-size:15px;color:#44337a;">👤 ${m.nome}</strong>
                    <span style="font-size:12px;color:#718096;margin-left:10px;">${m.sexo||''} · ${idade}</span>
                    <div style="font-size:13px;color:#718096;margin-top:4px;">🏠 <span style="cursor:pointer;color:#2b6cb0;" onclick="abrirFamilia(${m.familia_id})">${famLabel}</span></div>
                    ${fam?.numeroProntuario ? `<div style="font-size:12px;color:#4a5568;margin-top:2px;">📋 Prontuário: <strong>${fam.numeroProntuario}</strong></div>` : ''}
                    <div style="margin-top:6px;">${tags}${gestTag}</div>
                </div>
                <button onclick="abrirHistoricoSaude(${m.id})" style="background:#ebf8ff;color:#2b6cb0;border:1px solid #bee3f8;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:bold;white-space:nowrap;">📊 Saúde</button>
            </div>
        </div>`;
    }).join("");
}

function limparFiltrosCid() {
    ["filtroTextoCid"].forEach(id=>{const e=document.getElementById(id);if(e)e.value="";});
    ["filtroSexoCid","filtroCondCid","filtroIdadeCid"].forEach(id=>{const e=document.getElementById(id);if(e)e.value="";});
    mostrarCidadaosGeral();
}

// ------------------------------------
// BUSCA GLOBAL (novo)
// ------------------------------------
function buscaGlobal(texto) {
    const container = document.getElementById("resultadoBuscaGlobal");
    if (!container) return;
    if (!texto || texto.length < 2) { container.style.display = "none"; container.innerHTML = ""; return; }
    const q = texto.toLowerCase();
    let html = "";

    const famRes = familias.filter(f => (f.responsavel||"").toLowerCase().includes(q) || String(f.numeroFamilia).includes(q));
    if (famRes.length > 0) {
        html += `<div style="font-size:11px;font-weight:bold;color:#718096;padding:8px 10px 4px;text-transform:uppercase;letter-spacing:.05em;">Famílias</div>`;
        html += famRes.slice(0,5).map(f => `
            <div onclick="fecharBusca();abrirFamilia(${f.id})"
                 style="padding:10px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:10px;border:1px solid transparent;"
                 onmouseover="this.style.background='#ebf8ff';this.style.borderColor='#bee3f8'"
                 onmouseout="this.style.background='none';this.style.borderColor='transparent'">
                <span style="font-size:18px;flex-shrink:0;">🏠</span>
                <span>
                    <strong style="color:#2c5282;">Família ${f.numeroFamilia}</strong> — ${f.responsavel}<br>
                    <small style="color:#718096;">${f.logradouro||'Sem endereço'}</small>
                </span>
            </div>`).join("");
    }

    const memRes = membros.filter(m => (m.nome||"").toLowerCase().includes(q) || (m.cns||"").includes(q));
    if (memRes.length > 0) {
        html += `<div style="font-size:11px;font-weight:bold;color:#718096;padding:8px 10px 4px;text-transform:uppercase;letter-spacing:.05em;">Cidadãos</div>`;
        html += memRes.slice(0,5).map(m => {
            const fam = familias.find(f => f.id == m.familia_id);
            return `
            <div onclick="fecharBusca();abrirFamilia(${m.familia_id})"
                 style="padding:10px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:10px;border:1px solid transparent;"
                 onmouseover="this.style.background='#faf5ff';this.style.borderColor='#e9d8fd'"
                 onmouseout="this.style.background='none';this.style.borderColor='transparent'">
                <span style="font-size:18px;flex-shrink:0;">👤</span>
                <span>
                    <strong style="color:#44337a;">${m.nome}</strong><br>
                    <small style="color:#718096;">${fam ? `Família ${fam.numeroFamilia} — ${fam.responsavel}` : ''}</small>
                </span>
            </div>`;
        }).join("");
    }

    if (!html) html = `<div style="padding:16px;color:#718096;text-align:center;font-size:13px;">Nenhum resultado para "<strong>${texto}</strong>"</div>`;

    container.innerHTML = html;
    container.style.display = "block";
}

function fecharBusca() {
    const container = document.getElementById("resultadoBuscaGlobal");
    const input = document.getElementById("inputBuscaGlobal");
    if (container) { container.style.display = "none"; container.innerHTML = ""; }
    if (input) input.value = "";
}

// ------------------------------------
// VISITAS — SALVAR, EDITAR, EXCLUIR
// ------------------------------------
document.addEventListener("DOMContentLoaded", function() {
    const selectFamilia = document.getElementById("familiaVisita");
    const formVisita    = document.getElementById("formVisita");
    if (formVisita && selectFamilia) {
        function popularSelectVisita(filtro) {
            let atual = selectFamilia.value;
            selectFamilia.innerHTML='<option value="">Selecione a família visitada...</option>';
            let lista = familias.slice().sort((a,b)=>a.numeroFamilia-b.numeroFamilia);
            if (filtro) { const f=filtro.toLowerCase(); lista=lista.filter(fam=>String(fam.numeroFamilia).includes(f)||(fam.responsavel||"").toLowerCase().includes(f)); }
            lista.forEach(f=>selectFamilia.add(new Option(`Família Nº ${f.numeroFamilia} — ${f.responsavel}`,f.id)));
            if (atual) selectFamilia.value=atual;
        }
        popularSelectVisita();
        window.filtrarSelectFamilia=()=>popularSelectVisita(document.getElementById("buscaFamiliaVisita")?.value||"");
        const params=new URLSearchParams(window.location.search);
        const famIdUrl=params.get("familiaId");
        if (famIdUrl){selectFamilia.value=famIdUrl;carregarMembrosFamiliaParaVisita();}
        // Pré-preenche edição
        const editId=localStorage.getItem("editandoVisita");
        if (editId){
            const v=visitas.find(vis=>vis.id==editId);
            if (v){
                formVisita.dataset.editandoId=v.id;
                const set=(id,val)=>{const e=document.getElementById(id);if(e)e.value=val||"";};
                set("dataVisita",v.data); set("turnoVisita",v.turno||"Manhã");
                set("desfechoVisita",v.desfecho); set("infoVisita",v.info);
                set("detalhePendencia",v.detalhePendencia||"");
                if(v.familiaId){selectFamilia.value=v.familiaId;carregarMembrosFamiliaParaVisita();}
                if(v.pendenciaReceita)  document.getElementById("pendenciaReceita").checked=true;
                if(v.pendenciaMarcacao) document.getElementById("pendenciaMarcacao").checked=true;
                if(v.pendenciaPreventivo) document.getElementById("pendenciaPreventivo").checked=true;
                if(v.pendenciaEcg)      document.getElementById("pendenciaEcg").checked=true;
                Array.from(document.querySelectorAll('.motivo-chk')).forEach(c=>{if((v.motivos||"").includes(c.value))c.checked=true;});
                localStorage.removeItem("editandoVisita");
                const h1=document.querySelector(".page-title");if(h1)h1.textContent="EDITAR VISITA";
            }
        }
    }
});

if (document.getElementById("formVisita")) {
    document.getElementById("formVisita").addEventListener("submit", function(e) {
        e.preventDefault();
        const familiaId=document.getElementById("familiaVisita").value;
        if (!familiaId){alert("Selecione a família!");return;}
        const familia=familias.find(f=>f.id==familiaId);
        const nomeDestino=familia?`Família Nº ${familia.numeroFamilia}`:"Família";
        const membrosMarcados=[];
        document.querySelectorAll('.membro-visita-chk:checked').forEach(c=>membrosMarcados.push(c.value));
        // Captura a assinatura do canvas
        let assinaturaBase64 = null;
        const canvas = document.getElementById("signaturePad");
        if (canvas) {
            // Verifica se o canvas tem algo desenhado (não está em branco)
            const ctx = canvas.getContext("2d");
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            const temDesenho = pixels.some((val, i) => i % 4 !== 3 && val !== 0);
            if (temDesenho) assinaturaBase64 = canvas.toDataURL("image/png");
        }

        const dadosVisita={
            id:                  document.getElementById("formVisita").dataset.editandoId||Date.now(),
            familiaId,
            cidadao:             nomeDestino+(membrosMarcados.length?` (${membrosMarcados.join(", ")})` : ""),
            membrosAtendidos:    membrosMarcados,
            data:                document.getElementById("dataVisita").value,
            turno:               document.getElementById("turnoVisita").value,
            motivos:             Array.from(document.querySelectorAll('.motivo-chk:checked')).map(c=>c.value).join(", "),
            desfecho:            document.getElementById("desfechoVisita").value,
            info:                document.getElementById("infoVisita").value,
            foto:                window._fotoVisitaBase64,
            assinatura:          assinaturaBase64,
            pendenciaReceita:    document.getElementById("pendenciaReceita")?.checked||false,
            pendenciaMarcacao:   document.getElementById("pendenciaMarcacao")?.checked||false,
            pendenciaPreventivo: document.getElementById("pendenciaPreventivo")?.checked||false,
            pendenciaEcg:        document.getElementById("pendenciaEcg")?.checked||false,
            detalhePendencia:    document.getElementById("detalhePendencia")?.value||""
        };
        // Atualiza roteiro
        const idTarefa=sessionStorage.getItem("idTarefaPercursoAtiva");
        if (idTarefa){
            let roteiro=JSON.parse(localStorage.getItem("roteiroDigital"))||[];
            roteiro=roteiro.map(item=>item.id==idTarefa?{...item,status:"✅ Realizada"}:item);
            localStorage.setItem("roteiroDigital",JSON.stringify(roteiro));
            sessionStorage.removeItem("idTarefaPercursoAtiva");
        }
        if (document.getElementById("formVisita").dataset.editandoId){
            const idx=visitas.findIndex(v=>v.id==dadosVisita.id);
            if(idx!==-1) visitas[idx]=dadosVisita;
        } else { visitas.push(dadosVisita); }
        localStorage.setItem("visitas",JSON.stringify(visitas));
        showToast("✅ Visita salva com sucesso!", "verde"); setTimeout(()=>window.location.href="visitas_lista.html",1200); return;
        window.location.href="visitas_lista.html";
    });
}

function carregarMembrosFamiliaParaVisita() {
    const familiaId=document.getElementById("familiaVisita")?.value;
    const container=document.getElementById("membrosFamiliaContainer");
    if(!container)return;
    if(!familiaId){container.style.display="none";container.innerHTML="";return;}
    const memFam=membros.filter(m=>m.familia_id==familiaId);
    if(memFam.length>0){
        let html=`<label style="color:#2b6cb0;">Quais membros receberam atenção individual?</label><div style="display:flex;gap:15px;flex-wrap:wrap;margin-top:8px;">`;
        memFam.forEach(m=>{html+=`<label class="radio-label" style="background:#fff;padding:5px 10px;border-radius:4px;border:1px solid #bee3f8;"><input type="checkbox" class="membro-visita-chk" value="${m.nome}"> 👤 ${m.nome}</label>`;});
        html+=`</div>`; container.innerHTML=html; container.style.display="block";
    } else {
        container.innerHTML="<p style='color:#718096;font-size:13px;'>Nenhum membro cadastrado nesta casa.</p>";
        container.style.display="block";
    }
}

// ------------------------------------
// VISITAS — LISTAR COM FILTROS
// ------------------------------------
function mostrarVisitasGeral(lista) {
    const container=document.getElementById("listaVisitasGeral");
    if(!container)return;
    const contador=document.getElementById("contadorVisitas");
    if(contador) contador.textContent=`Exibindo ${lista.length} de ${visitas.length} visitas`;
    if(lista.length===0){container.innerHTML=`<div style="text-align:center;padding:30px;color:#718096;">Nenhuma visita encontrada.</div>`;return;}
    container.innerHTML=lista.sort((a,b)=>new Date(b.data)-new Date(a.data)).map(v=>{
        const cor=v.desfecho==="Visita Realizada"?"#22543d":"#742a2a";
        const bg =v.desfecho==="Visita Realizada"?"#c6f6d5":"#fed7d7";
        const temPend=[v.pendenciaReceita,v.pendenciaMarcacao,v.pendenciaPreventivo,v.pendenciaEcg].some(Boolean)||v.detalhePendencia;
        return `
        <div class="box visita-item" style="margin-bottom:12px;border-left:4px solid #3182ce;padding:15px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
                <div>
                    <strong style="font-size:15px;color:#1a365d;">🏠 ${v.cidadao}</strong><br>
                    <span style="font-size:13px;color:#718096;">📅 ${v.data?v.data.split('-').reverse().join('/'):'—'} · ${v.turno||''}</span>
                    ${temPend?`<span style="margin-left:8px;font-size:12px;background:#fffbeb;color:#744210;border:1px solid #f6ad55;padding:2px 6px;border-radius:4px;">⚠️ Tem pendências</span>`:''}
                </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span style="font-size:12px;font-weight:bold;color:${cor};background:${bg};padding:4px 10px;border-radius:4px;">${v.desfecho}</span>
                    <button onclick="editarVisita(${v.id})" style="background:#ebf8ff;color:#2b6cb0;border:1px solid #bee3f8;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:12px;">✏️</button>
                    <button onclick="excluirVisita(${v.id})" style="background:#fff5f5;color:#c53030;border:1px solid #fed7d7;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:12px;">🗑️</button>
                </div>
            </div>
            ${v.motivos?`<p style="font-size:13px;color:#4a5568;margin-top:8px;">📌 ${v.motivos}</p>`:''}
            ${v.info?`<p style="font-size:13px;color:#4a5568;margin-top:4px;">📝 ${v.info}</p>`:''}
            ${v.foto?`<img src="${v.foto}" style="max-width:100%;max-height:180px;border-radius:6px;margin-top:10px;">`:''}
            ${v.assinatura?`<div style="margin-top:8px;padding:8px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;"><span style="font-size:11px;color:#718096;display:block;margin-bottom:4px;">✍️ Assinatura do responsável</span><img src="${v.assinatura}" style="max-height:65px;border-radius:4px;background:white;"></div>`:''}
        </div>`; }).join("");
}

function filtrarVisitas() {
    const texto   =(document.getElementById("filtroTextoVis")?.value||"").toLowerCase();
    const desfecho= document.getElementById("filtroDesfechoVis")?.value||"";
    const dataIni = document.getElementById("filtroDataIniVis")?.value||"";
    const dataFim = document.getElementById("filtroDataFimVis")?.value||"";
    let resultado=visitas.filter(v=>{
        if(texto   && !(v.cidadao||"").toLowerCase().includes(texto)) return false;
        if(desfecho && v.desfecho!==desfecho) return false;
        if(dataIni  && v.data<dataIni) return false;
        if(dataFim  && v.data>dataFim) return false;
        return true;
    });
    mostrarVisitasGeral(resultado);
}

function limparFiltrosVis() {
    ["filtroTextoVis","filtroDataIniVis","filtroDataFimVis"].forEach(id=>{const e=document.getElementById(id);if(e)e.value="";});
    ["filtroDesfechoVis"].forEach(id=>{const e=document.getElementById(id);if(e)e.value="";});
    filtrarVisitas();
}

function excluirVisita(id) {
    if(!confirm("Excluir esta visita?"))return;
    visitas=visitas.filter(v=>v.id!=id);
    localStorage.setItem("visitas",JSON.stringify(visitas));
    if(document.getElementById("listaVisitasGeral")) filtrarVisitas();
    if(document.getElementById("historicoVisitasFamilia")) mostrarFamiliaDetalhe();
}

function editarVisita(id) {
    localStorage.setItem("editandoVisita",id);
    window.location.href="visitas.html";
}

// ------------------------------------
// PERCURSO — confirma visita como realizada
// ------------------------------------
function iniciarVisitaRoteiro(familiaId) {
    const roteiro=JSON.parse(localStorage.getItem("roteiroDigital"))||[];
    const item=roteiro.find(r=>r.familiaId==familiaId&&r.data===document.getElementById("dataPercurso")?.value);
    if(item) sessionStorage.setItem("idTarefaPercursoAtiva",item.id);
    window.location.href=`visitas.html?familiaId=${familiaId}`;
}

// ------------------------------------
// FOTOS
// ------------------------------------
window._fotoVisitaBase64=null;
window._fotoFamiliaBase64=null;

function preVisualizarFoto(input) {
    if(!input.files||!input.files[0])return;
    if(input.files[0].size>5*1024*1024){alert("Foto muito grande (máx 5MB).");input.value="";return;}
    const reader=new FileReader();
    reader.onload=e=>{
        window._fotoVisitaBase64=e.target.result;
        const prev=document.getElementById('fotoPreview'); if(prev){prev.src=e.target.result;prev.style.display='block';}
        const st=document.getElementById('fotoStatus'); if(st)st.style.display='block';
        const btn=document.getElementById('btnRemoverFoto'); if(btn)btn.style.display='inline-block';
    };
    reader.readAsDataURL(input.files[0]);
}
function removerFoto() {
    window._fotoVisitaBase64=null;
    const i=document.getElementById('fotoVisita'); if(i)i.value="";
    const p=document.getElementById('fotoPreview'); if(p){p.src="";p.style.display='none';}
    const b=document.getElementById('btnRemoverFoto'); if(b)b.style.display='none';
}
function preVisualizarFotoFamilia(input) {
    if(!input.files||!input.files[0])return;
    if(input.files[0].size>5*1024*1024){alert("Foto muito grande (máx 5MB).");input.value="";return;}
    const reader=new FileReader();
    reader.onload=e=>{
        window._fotoFamiliaBase64=e.target.result;
        const prev=document.getElementById("previewFotoFamilia"); if(prev){prev.src=e.target.result;prev.style.display="block";}
        const btn=document.getElementById("btnRemoverFotoFam"); if(btn)btn.style.display="inline-block";
    };
    reader.readAsDataURL(input.files[0]);
}
function removerFotoFamilia() {
    window._fotoFamiliaBase64=null;
    const i=document.getElementById("fotoFamilia"); if(i)i.value="";
    const p=document.getElementById("previewFotoFamilia"); if(p){p.src="";p.style.display="none";}
    const b=document.getElementById("btnRemoverFotoFam"); if(b)b.style.display="none";
}

// ------------------------------------
// ASSINATURA
// ------------------------------------
(function iniciarAssinatura(){
    const canvas=document.getElementById("signaturePad");
    if(!canvas)return;
    const ctx=canvas.getContext("2d");
    function redimensionar(){
        const ratio=window.devicePixelRatio||1;
        canvas.width=canvas.offsetWidth*ratio; canvas.height=canvas.offsetHeight*ratio;
        ctx.scale(ratio,ratio); ctx.strokeStyle="#1a365d"; ctx.lineWidth=2; ctx.lineCap="round";
    }
    redimensionar(); window.addEventListener("resize",redimensionar);
    let desenhando=false,ux=0,uy=0;
    const getPonto=e=>{const r=canvas.getBoundingClientRect();return e.touches?{x:e.touches[0].clientX-r.left,y:e.touches[0].clientY-r.top}:{x:e.clientX-r.left,y:e.clientY-r.top};};
    canvas.addEventListener("mousedown",e=>{desenhando=true;const p=getPonto(e);ux=p.x;uy=p.y;});
    canvas.addEventListener("mousemove",e=>{if(!desenhando)return;const p=getPonto(e);ctx.beginPath();ctx.moveTo(ux,uy);ctx.lineTo(p.x,p.y);ctx.stroke();ux=p.x;uy=p.y;});
    canvas.addEventListener("mouseup",()=>desenhando=false);
    canvas.addEventListener("mouseleave",()=>desenhando=false);
    canvas.addEventListener("touchstart",e=>{e.preventDefault();desenhando=true;const p=getPonto(e);ux=p.x;uy=p.y;},{passive:false});
    canvas.addEventListener("touchmove",e=>{e.preventDefault();if(!desenhando)return;const p=getPonto(e);ctx.beginPath();ctx.moveTo(ux,uy);ctx.lineTo(p.x,p.y);ctx.stroke();ux=p.x;uy=p.y;},{passive:false});
    canvas.addEventListener("touchend",()=>desenhando=false);
})();

function limparAssinatura(){
    const c=document.getElementById("signaturePad");
    if(c)c.getContext("2d").clearRect(0,0,c.width,c.height);
}

// ------------------------------------
// VALIDAÇÃO DATA FUTURA
// ------------------------------------
function validarDataVisita(input){
    const hoje=new Date().toISOString().split('T')[0];
    const aviso=document.getElementById("avisoDataFutura");
    if(aviso)aviso.style.display=input.value>hoje?"block":"none";
}

// ------------------------------------
// ALERTAS AUTOMÁTICOS (novo)
// ------------------------------------
function verificarAlertasAutomaticos() {
    const container=document.getElementById("alertasAutomaticos");
    if(!container)return;
    const alertas=[];
    const hoje=new Date();

    // Gestantes sem visita este mês
    const visitasMes=visitas.filter(v=>{
        const d=new Date(v.data);
        return d.getMonth()===hoje.getMonth()&&d.getFullYear()===hoje.getFullYear()&&v.desfecho==="Visita Realizada";
    });
    const famVisitadasMes=new Set(visitasMes.map(v=>String(v.familiaId)));
    const gestantes=membros.filter(m=>m.gestante==="Sim");
    gestantes.forEach(g=>{
        if(!famVisitadasMes.has(String(g.familia_id))){
            alertas.push({tipo:"danger",msg:`🤰 <strong>${g.nome}</strong> — Gestante sem visita este mês!`});
        }
    });

    // Acamados/Domiciliados há mais de 15 dias
    membros.filter(m=>m.doencas_lista?.includes("Acamado")||m.doencas_lista?.includes("Domiciliado")).forEach(m=>{
        const vFam=visitas.filter(v=>v.familiaId==m.familia_id).sort((a,b)=>new Date(b.data)-new Date(a.data));
        const ultima=vFam.length?new Date(vFam[0].data):null;
        const dias=ultima?Math.floor((hoje-ultima)/(1000*60*60*24)):999;
        if(dias>15){
            alertas.push({tipo:"warning",msg:`🛏️ <strong>${m.nome}</strong> — ${m.doencas_lista.includes("Acamado")?"Acamado":"Domiciliado"} há ${dias>300?"muito tempo":dias+"d"} sem visita`});
        }
    });

    // Crianças próximas de 2 anos
    membros.forEach(m=>{
        if(!m.nascimento)return;
        const nasc=new Date(m.nascimento);
        const anos2=new Date(nasc); anos2.setFullYear(anos2.getFullYear()+2);
        const diasPara2anos=Math.floor((anos2-hoje)/(1000*60*60*24));
        if(diasPara2anos>=0&&diasPara2anos<=30){
            alertas.push({tipo:"info",msg:`👶 <strong>${m.nome}</strong> — Completa 2 anos em ${diasPara2anos} dia(s). Sairá do grupo prioritário de crianças.`});
        }
    });

    if(alertas.length===0){
        container.style.display="none";return;
    }
    container.style.display="block";
    container.innerHTML=`
        <div style="background:white;border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.05);padding:16px;margin-bottom:20px;">
            <h3 style="color:#c53030;margin-bottom:12px;">🔔 Alertas Automáticos (${alertas.length})</h3>
            ${alertas.map(a=>`
                <div style="padding:8px 12px;margin-bottom:8px;border-radius:6px;font-size:13px;
                    background:${a.tipo==="danger"?"#fff5f5":a.tipo==="warning"?"#fffbeb":"#ebf8ff"};
                    border-left:4px solid ${a.tipo==="danger"?"#e53e3e":a.tipo==="warning"?"#ed8936":"#3182ce"};">
                    ${a.msg}
                </div>`).join('')}
        </div>`;
}

// ------------------------------------
// RELATÓRIO COMPLETO (novo)
// ------------------------------------
function gerarRelatorio() {
    const container=document.getElementById("conteudoRelatorio");
    if(!container)return;
    const perfil=JSON.parse(localStorage.getItem("acsPerfil"))||{nome:"ACS Digital",ubs:"UBS",microarea:"—"};
    const hoje=new Date();
    const mesRef=hoje.toLocaleString('pt-BR',{month:'long',year:'numeric'});

    const visitasMes=visitas.filter(v=>{
        const d=new Date(v.data);
        return d.getMonth()===hoje.getMonth()&&d.getFullYear()===hoje.getFullYear();
    });
    const realizadas=visitasMes.filter(v=>v.desfecho==="Visita Realizada");
    const recusadas =visitasMes.filter(v=>v.desfecho==="Visita Recusada").length;
    const ausentes  =visitasMes.filter(v=>v.desfecho==="Ausente").length;

    const hipertensos    =membros.filter(m=>m.doencas_lista?.includes("Hipertensão")).length;
    const diabeticos     =membros.filter(m=>m.doencas_lista?.includes("Diabetes")).length;
    const gestantes      =membros.filter(m=>m.gestante==="Sim").length;
    const idosos         =membros.filter(m=>{if(!m.nascimento)return false;return Math.floor((hoje-new Date(m.nascimento))/(1000*60*60*24*365.25))>=60;}).length;
    const acamados       =membros.filter(m=>m.doencas_lista?.includes("Acamado")).length;
    const domiciliados   =membros.filter(m=>m.doencas_lista?.includes("Domiciliado")).length;
    const criancas       =membros.filter(m=>{if(!m.nascimento)return false;const a=Math.floor((hoje-new Date(m.nascimento))/(1000*60*60*24*365.25));return a<2;}).length;
    const tabagistas     =membros.filter(m=>m.fuma==="Sim").length;

    const famVisitadas   =new Set(realizadas.map(v=>String(v.familiaId))).size;
    const cfg            =JSON.parse(localStorage.getItem("metasConfig2"))||{metaVisitasPct:80};
    const metaFam        =Math.ceil(familias.length*(cfg.metaVisitasPct/100));
    const pct            =metaFam===0?0:Math.min(100,Math.round((famVisitadas/metaFam)*100));

    container.innerHTML=`
    <div style="border:2px solid #1a365d;border-radius:10px;padding:20px;margin-bottom:20px;text-align:center;" class="cabecalho-relatorio">
        <h2 style="color:#1a365d;margin-bottom:4px;">RELATÓRIO MENSAL DE ATIVIDADES</h2>
        <p style="color:#4a5568;margin:2px 0;"><strong>Agente:</strong> ${perfil.nome} | <strong>UBS:</strong> ${perfil.ubs} | <strong>Microárea:</strong> ${perfil.microarea}</p>
        <p style="color:#4a5568;margin:2px 0;"><strong>Período:</strong> ${mesRef.toUpperCase()}</p>
    </div>

    <div class="box" style="margin-bottom:16px;">
        <h3 style="color:#2b6cb0;border-bottom:2px solid #2b6cb0;padding-bottom:5px;">📊 Produtividade Geral</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:10px;">
            <tr style="background:#edf2f7;"><th style="border:1px solid #cbd5e0;padding:10px;text-align:left;">Indicador</th><th style="border:1px solid #cbd5e0;padding:10px;text-align:center;">Qtd</th></tr>
            <tr><td style="border:1px solid #e2e8f0;padding:10px;">Visitas Domiciliares Realizadas</td><td style="border:1px solid #e2e8f0;padding:10px;text-align:center;font-weight:bold;color:#22543d;">${realizadas.length}</td></tr>
            <tr><td style="border:1px solid #e2e8f0;padding:10px;">Visitas Recusadas</td><td style="border:1px solid #e2e8f0;padding:10px;text-align:center;">${recusadas}</td></tr>
            <tr><td style="border:1px solid #e2e8f0;padding:10px;">Ausentes</td><td style="border:1px solid #e2e8f0;padding:10px;text-align:center;">${ausentes}</td></tr>
            <tr><td style="border:1px solid #e2e8f0;padding:10px;">Famílias Visitadas no Mês</td><td style="border:1px solid #e2e8f0;padding:10px;text-align:center;">${famVisitadas} de ${familias.length} (${pct}%)</td></tr>
            <tr><td style="border:1px solid #e2e8f0;padding:10px;">Total de Famílias Cadastradas</td><td style="border:1px solid #e2e8f0;padding:10px;text-align:center;">${familias.length}</td></tr>
            <tr><td style="border:1px solid #e2e8f0;padding:10px;">Total de Cidadãos Cadastrados</td><td style="border:1px solid #e2e8f0;padding:10px;text-align:center;">${membros.length}</td></tr>
        </table>
    </div>

    <div class="box" style="margin-bottom:16px;">
        <h3 style="color:#2b6cb0;border-bottom:2px solid #2b6cb0;padding-bottom:5px;">👥 Grupos Prioritários Cadastrados</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:10px;">
            <tr style="background:#edf2f7;"><th style="border:1px solid #cbd5e0;padding:10px;text-align:left;">Grupo</th><th style="border:1px solid #cbd5e0;padding:10px;text-align:center;">Cadastrados</th></tr>
            <tr><td style="border:1px solid #e2e8f0;padding:10px;">❤️ Hipertensos</td><td style="border:1px solid #e2e8f0;padding:10px;text-align:center;">${hipertensos}</td></tr>
            <tr><td style="border:1px solid #e2e8f0;padding:10px;">🩸 Diabéticos</td><td style="border:1px solid #e2e8f0;padding:10px;text-align:center;">${diabeticos}</td></tr>
            <tr><td style="border:1px solid #e2e8f0;padding:10px;">🤰 Gestantes</td><td style="border:1px solid #e2e8f0;padding:10px;text-align:center;">${gestantes}</td></tr>
            <tr><td style="border:1px solid #e2e8f0;padding:10px;">👴 Idosos (60+)</td><td style="border:1px solid #e2e8f0;padding:10px;text-align:center;">${idosos}</td></tr>
            <tr><td style="border:1px solid #e2e8f0;padding:10px;">🛏️ Acamados</td><td style="border:1px solid #e2e8f0;padding:10px;text-align:center;">${acamados}</td></tr>
            <tr><td style="border:1px solid #e2e8f0;padding:10px;">🏠 Domiciliados</td><td style="border:1px solid #e2e8f0;padding:10px;text-align:center;">${domiciliados}</td></tr>
            <tr><td style="border:1px solid #e2e8f0;padding:10px;">👶 Crianças (menor de 2 anos)</td><td style="border:1px solid #e2e8f0;padding:10px;text-align:center;">${criancas}</td></tr>
            <tr><td style="border:1px solid #e2e8f0;padding:10px;">🚬 Tabagistas</td><td style="border:1px solid #e2e8f0;padding:10px;text-align:center;">${tabagistas}</td></tr>
        </table>
    </div>

    <div class="box" style="margin-bottom:16px;">
        <h3 style="color:#2b6cb0;border-bottom:2px solid #2b6cb0;padding-bottom:5px;">📋 Registro de Visitas do Mês</h3>
        ${visitasMes.length===0?'<p style="color:#a0aec0;text-align:center;padding:20px;">Nenhuma visita registrada este mês.</p>':
        `<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:10px;">
            <tr style="background:#edf2f7;">
                <th style="border:1px solid #cbd5e0;padding:8px;text-align:left;">Data</th>
                <th style="border:1px solid #cbd5e0;padding:8px;text-align:left;">Família</th>
                <th style="border:1px solid #cbd5e0;padding:8px;text-align:left;">Motivo</th>
                <th style="border:1px solid #cbd5e0;padding:8px;text-align:center;">Desfecho</th>
            </tr>
            ${visitasMes.sort((a,b)=>new Date(a.data)-new Date(b.data)).map(v=>`
            <tr>
                <td style="border:1px solid #e2e8f0;padding:8px;">${v.data?v.data.split('-').reverse().join('/'):'—'}</td>
                <td style="border:1px solid #e2e8f0;padding:8px;">${v.cidadao||'—'}</td>
                <td style="border:1px solid #e2e8f0;padding:8px;">${v.motivos||'—'}</td>
                <td style="border:1px solid #e2e8f0;padding:8px;text-align:center;font-weight:bold;color:${v.desfecho==='Visita Realizada'?'#22543d':'#742a2a'};">${v.desfecho}</td>
            </tr>`).join('')}
        </table>`}
    </div>

    <div class="box" style="margin-top:30px;">
        <h3 style="color:#2b6cb0;border-bottom:2px solid #2b6cb0;padding-bottom:5px;">✍️ Assinaturas</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:20px;">
            <div style="text-align:center;">
                <div style="border-top:1px solid #4a5568;padding-top:8px;margin-top:40px;">
                    <strong>${perfil.nome}</strong><br>
                    <span style="font-size:13px;color:#718096;">Agente Comunitário de Saúde — Microárea ${perfil.microarea}</span>
                </div>
            </div>
            <div style="text-align:center;">
                <div style="border-top:1px solid #4a5568;padding-top:8px;margin-top:40px;">
                    <strong>___________________________</strong><br>
                    <span style="font-size:13px;color:#718096;">Supervisor(a) / Enfermeiro(a) — ${perfil.ubs}</span>
                </div>
            </div>
        </div>
    </div>`;
}

// ------------------------------------
// INICIALIZAÇÃO POR PÁGINA
// ------------------------------------
document.addEventListener("DOMContentLoaded", function() {
    atualizarContadores();
    calcularMetasEPrioridades();
    carregarBuscaAtiva();
    verificarAlertasAutomaticos();
    renderizarGraficoVisitas();

    if(document.getElementById("listaFamilias"))       filtrarFamilias();
    if(document.getElementById("listaCidadaos"))       mostrarCidadaosGeral();
    if(document.getElementById("listaVisitasGeral"))   filtrarVisitas();
    if(document.getElementById("listaPendencias"))     renderizarPendencias();
    if(document.getElementById("conteudoRelatorio"))   gerarRelatorio();

    if(document.getElementById("dadosFamilia")) {
        mostrarFamiliaDetalhe();
        renderizarMembrosDetalhe();
        const btnNova=document.getElementById("btnNovaVisitaDetalhe");
        const famId=localStorage.getItem("familiaAtual");
        if(btnNova&&famId) btnNova.onclick=()=>window.location.href=`visitas.html?familiaId=${famId}`;
    }

    if(document.getElementById("formMembro")) {
        const famId=localStorage.getItem("familiaAtual");
        if(famId) {
            const secao=document.getElementById("secaoMembros");
            if(secao&&!localStorage.getItem("editandoFamilia")) secao.style.display="block";
            renderizarMembrosSalvos();
        }
    }
});

// ------------------------------------
// HISTÓRICO DE SAÚDE POR CIDADÃO
// ------------------------------------
function abrirHistoricoSaude(membroId) {
    localStorage.setItem("membroSaudeAtual", membroId);
    window.location.href = "saude_cidadao.html";
}

// ------------------------------------
// MENU HAMBÚRGUER (mobile)
// ------------------------------------
function toggleSidebar() {
    const sidebar  = document.querySelector('.sidebar');
    const overlay  = document.getElementById('sidebarOverlay');
    if (!sidebar) return;
    const aberta = sidebar.classList.toggle('aberta');
    if (overlay) overlay.classList.toggle('aberto', aberta);
    document.body.style.overflow = aberta ? 'hidden' : '';
}

function fecharSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('aberta');
    if (overlay) overlay.classList.remove('aberto');
    document.body.style.overflow = '';
}

// Fecha sidebar ao navegar (click em botão do menu)
// Exclui os botões de grupo (nav-grupo-btn) para não fechar ao abrir submenu
document.querySelectorAll('.sidebar nav button:not(.nav-grupo-btn)').forEach(btn => {
    btn.addEventListener('click', fecharSidebar);
});

// ------------------------------------
// CARD DE META — reage ao progresso
// ------------------------------------
function colorirCardMeta(pct) {
    const card = document.getElementById('cardMeta');
    if (!card) return;
    if (pct >= 80)      card.dataset.meta = 'ok';
    else if (pct >= 50) card.dataset.meta = 'alerta';
    else                card.dataset.meta = 'critico';
}

// ------------------------------------
// SIDEBAR — MENU COM SUBGRUPOS
// ------------------------------------
function toggleGrupo(id) {
    const submenu = document.getElementById('sub_' + id);
    const btn     = document.getElementById('btn_' + id);
    if (!submenu || !btn) return;
    const aberto = submenu.classList.toggle('aberto');
    btn.classList.toggle('aberto', aberto);
    // Salva estado aberto para manter entre navegações
    try { localStorage.setItem('menu_' + id, aberto ? '1' : '0'); } catch(e) {}
}

function iniciarMenuSidebar() {
    // Detecta a página atual
    const paginaAtual = window.location.pathname.split('/').pop() || 'index.html';

    // Mapa de qual grupo abrir automaticamente por página
    const gruposPorPagina = {
        'familias.html':       'familias',
        'familias_lista.html': 'familias',
        'familia_detalhe.html':'familias',
        'cidadaos_lista.html': 'familias',
        'saude_cidadao.html':  'familias',
        'visitas.html':        'visitas',
        'visitas_lista.html':  'visitas',
        'pendencias.html':     'visitas',
        'relatorios.html':     'relatorios',
        'relatorio_mensal.html':'relatorios',
        'metas.html':          'relatorios',
        'agenda.html':         'planejamento',
        'percurso.html':       'planejamento',
        'mapa.html':           'planejamento',
        'configuracoes.html':  'config',
        'importador.html':     'config',
    };

    const grupoAtivo = gruposPorPagina[paginaAtual];

    // Abre o grupo da página atual automaticamente
    if (grupoAtivo) {
        const sub = document.getElementById('sub_' + grupoAtivo);
        const btn = document.getElementById('btn_' + grupoAtivo);
        if (sub) sub.classList.add('aberto');
        if (btn) btn.classList.add('aberto');
    }

    // Marca o botão da página atual como active
    const todos = document.querySelectorAll('.nav-submenu button, .sidebar nav > button');
    todos.forEach(btn => {
        const href = btn.getAttribute('onclick') || '';
        if (href.includes(paginaAtual)) btn.classList.add('active');
    });

    // Marca o grupo pai como active se estiver na página
    if (grupoAtivo) {
        const btnGrupo = document.getElementById('btn_' + grupoAtivo);
        if (btnGrupo) btnGrupo.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', iniciarMenuSidebar);

// ------------------------------------
// CARREGA PERFIL NA SIDEBAR
// ------------------------------------
function carregarPerfilSidebar() {
    const perfil = JSON.parse(localStorage.getItem("acsPerfil")) || {};
    const nome   = document.getElementById("sidebarNomePerfil");
    const micro  = document.getElementById("sidebarMicroarea");
    const foto   = document.getElementById("sidebarFotoPerfil");
    if (nome  && perfil.nome)      nome.textContent  = perfil.nome;
    if (micro && perfil.microarea) micro.textContent = "Microárea " + perfil.microarea;
    if (foto  && perfil.foto)      foto.src          = perfil.foto;
}
document.addEventListener('DOMContentLoaded', carregarPerfilSidebar);

// Redesenha gráfico quando janela muda de tamanho
window.addEventListener('resize', () => {
    if (document.getElementById("graficoVisitasSemana")) renderizarGraficoVisitas();
});

// ------------------------------------
// EXPORTAR CSV PARA e-SUS
// ------------------------------------
function exportarCSVeSUS() {
    const hoje = new Date();
    const mesRef = document.getElementById("mesReferencia")?.value || `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}`;
    const [ano, mes] = mesRef.split("-");
    const perfil = JSON.parse(localStorage.getItem("acsPerfil")) || { nome:"ACS", microarea:"03" };

    const visitasFiltradas = visitas.filter(v => {
        if (!v.data) return false;
        const d = new Date(v.data);
        return d.getMonth()==mes-1 && d.getFullYear()==ano;
    });

    const linhas = [
        ["Data","Família","Membros Atendidos","Motivo","Desfecho","Turno","Informações","ACS","Microárea"]
    ];

    visitasFiltradas.forEach(v => {
        const fam = familias.find(f => f.id == v.familiaId);
        linhas.push([
            v.data || "",
            fam ? `Família ${fam.numeroFamilia} - ${fam.responsavel}` : v.cidadao || "",
            (v.membrosAtendidos||[]).join("; "),
            v.motivos || "",
            v.desfecho || "",
            v.turno || "",
            (v.info||"").replace(/[\n\r;]/g," "),
            perfil.nome,
            perfil.microarea
        ]);
    });

    const csv = linhas.map(l => l.map(c => `"${String(c).replace(/"/g,'""')}"`).join(";")).join("\n");
    const bom = "\uFEFF"; // BOM UTF-8 para Excel
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Visitas_eSUS_${mes}_${ano}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`✅ CSV exportado: ${visitasFiltradas.length} visitas`, "verde");
}

// ------------------------------------
// INDICADOR OFFLINE / ONLINE
// ------------------------------------
function iniciarIndicadorOffline() {
    const div = document.createElement("div");
    div.id = "indicadorOffline";
    div.style.cssText = `
        display:none; position:fixed; top:0; left:0; right:0; z-index:9999;
        background:#e53e3e; color:white; text-align:center;
        padding:8px 16px; font-size:13px; font-weight:bold;
        box-shadow:0 2px 8px rgba(0,0,0,0.2);
    `;
    div.textContent = "📵 Sem conexão — modo offline ativo. Dados serão salvos localmente.";
    document.body.appendChild(div);

    function atualizar() {
        div.style.display = navigator.onLine ? "none" : "block";
        if (navigator.onLine) {
            const ok = document.createElement("div");
            ok.style.cssText = `position:fixed;top:0;left:0;right:0;z-index:9999;background:#38a169;color:white;text-align:center;padding:8px;font-size:13px;font-weight:bold;`;
            ok.textContent = "✅ Conexão restaurada!";
            document.body.appendChild(ok);
            setTimeout(() => ok.remove(), 2500);
        }
    }

    window.addEventListener("online",  atualizar);
    window.addEventListener("offline", atualizar);
    atualizar();
}
document.addEventListener("DOMContentLoaded", iniciarIndicadorOffline);

// ------------------------------------
// PROTEÇÃO POR PIN — verificar sessão
// ------------------------------------
function verificarPinSessao() {
    const pin = localStorage.getItem("pinAcesso");
    if (!pin) return; // PIN não configurado, deixa passar
    const sessao = localStorage.getItem("pinSessao");
    if (!sessao) { window.location.href = "pin.html"; return; }
    // Sessão expira em 8 horas
    const diff = Date.now() - parseInt(sessao);
    if (diff > 8 * 60 * 60 * 1000) { window.location.href = "pin.html"; }
}
// Só verifica PIN em páginas principais (não na própria pin.html)
if (!window.location.pathname.endsWith("pin.html")) {
    document.addEventListener("DOMContentLoaded", verificarPinSessao);
}

// ------------------------------------
// ORDENAÇÃO NAS LISTAS
// ------------------------------------
let ordemFamilias = "numero";
function ordenarFamilias(criterio) {
    ordemFamilias = criterio;
    filtrarFamilias();
}

// Atualiza mostrarFamilias para respeitar ordenação
const _mostrarFamilias = mostrarFamilias;
mostrarFamilias = function(filtradas) {
    let dados = (filtradas !== undefined ? filtradas : familias).slice();
    if (ordemFamilias === "numero")    dados.sort((a,b) => a.numeroFamilia - b.numeroFamilia);
    if (ordemFamilias === "nome")      dados.sort((a,b) => (a.responsavel||"").localeCompare(b.responsavel||""));
    if (ordemFamilias === "visita")    dados.sort((a,b) => {
        const va = visitas.filter(v=>v.familiaId==a.id).sort((x,y)=>new Date(y.data)-new Date(x.data))[0];
        const vb = visitas.filter(v=>v.familiaId==b.id).sort((x,y)=>new Date(y.data)-new Date(x.data))[0];
        const da = va ? new Date(va.data) : new Date(0);
        const db = vb ? new Date(vb.data) : new Date(0);
        return da - db; // mais antigas primeiro
    });
    _mostrarFamilias(dados);
};


// ============================================================
//  MELHORIAS — TOAST (substitui alert)
// ============================================================
function showToast(msg, tipo = "normal", duracao = 3000) {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.style.cssText = "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;";
        document.body.appendChild(container);
    }
    const cores = { normal:"#1a365d", verde:"#22543d", vermelho:"#742a2a", laranja:"#744210" };
    const toast = document.createElement("div");
    toast.style.cssText = `background:${cores[tipo]||cores.normal};color:white;padding:12px 22px;border-radius:999px;font-size:14px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.25);opacity:0;transform:translateY(16px);transition:all 0.3s ease;white-space:nowrap;max-width:90vw;text-align:center;`;
    toast.textContent = msg;
    container.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = "1"; toast.style.transform = "translateY(0)"; });
    setTimeout(() => {
        toast.style.opacity = "0"; toast.style.transform = "translateY(16px)";
        setTimeout(() => toast.remove(), 320);
    }, duracao);
}

// ============================================================
//  MELHORIAS — MODO ESCURO
// ============================================================
function aplicarTema() {
    const tema = localStorage.getItem("tema") || "claro";
    document.documentElement.setAttribute("data-tema", tema);
    const btn = document.getElementById("btnToggleTema");
    if (btn) btn.textContent = tema === "escuro" ? "☀️" : "🌙";
}

function toggleTema() {
    const novo = (localStorage.getItem("tema") || "claro") === "escuro" ? "claro" : "escuro";
    localStorage.setItem("tema", novo);
    aplicarTema();
    showToast(novo === "escuro" ? "🌙 Modo escuro ativado" : "☀️ Modo claro ativado", "normal", 1800);
}

function injetarBotaoTema() {
    if (document.getElementById("btnToggleTema")) return;
    const btn = document.createElement("button");
    btn.id = "btnToggleTema";
    btn.title = "Alternar modo escuro";
    btn.onclick = toggleTema;
    document.body.appendChild(btn);
    aplicarTema();
}

// ============================================================
//  MELHORIAS — ANIVERSARIANTES DO DIA
// ============================================================
function verificarAniversariantes() {
    const container = document.getElementById("alertasAutomaticos");
    if (!container) return;
    const hoje = new Date();
    const aniversariantes = membros.filter(m => {
        if (!m.nascimento) return false;
        const [,mes,dia] = m.nascimento.split("-").map(Number);
        return dia === hoje.getDate() && mes === (hoje.getMonth()+1);
    });
    if (aniversariantes.length === 0) return;
    const bloco = document.createElement("div");
    bloco.innerHTML = aniversariantes.map(m => {
        const fam = familias.find(f => f.id == m.familia_id);
        const idade = hoje.getFullYear() - parseInt(m.nascimento.split("-")[0]);
        return `<div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid #f6ad55;border-left:5px solid #d69e2e;border-radius:10px;padding:14px 18px;margin-bottom:12px;display:flex;align-items:center;gap:12px;">
            <span style="font-size:26px;flex-shrink:0;">🎂</span>
            <div>
                <strong>${m.nome}</strong> faz <strong>${idade} anos</strong> hoje!
                ${fam ? `<span style="font-size:12px;color:#975a16;margin-left:6px;">🏠 Família ${fam.numeroFamilia}</span>` : ''}
                <div style="margin-top:4px;"><span class="aniversario-badge">🎉 Aniversariante do dia</span></div>
            </div>
        </div>`;
    }).join('');
    container.prepend(bloco);
    container.style.display = "block";
}

// ============================================================
//  MELHORIAS — ALERTA VACINAÇÃO NO PAINEL
// ============================================================
function verificarVacinacaoPainel() {
    const container = document.getElementById("alertasAutomaticos");
    if (!container) return;
    const hoje = new Date();
    const VACINAS_CRIANCA  = ["BCG","Hepatite B","Pentavalente (DTP+Hib+HepB)","VIP (Pólio injetável)","VRH (Rotavírus)","Pneumo 10","Meningocócica C","Febre Amarela","Tríplice Viral (SCR)","VOP (Pólio oral)","DTP (reforço)","Varicela","Hepatite A"];
    const VACINAS_GESTANTE = ["dTpa (Coqueluche)","Hepatite B","Influenza"];
    const VACINAS_IDOSO    = ["Influenza (anual)","Pneumo 23","dT (dupla adulto)"];
    const todasVac = JSON.parse(localStorage.getItem("vacinacao")) || {};
    let totalPendentes = 0;
    membros.forEach(m => {
        const idade = m.nascimento ? Math.floor((hoje - new Date(m.nascimento)) / (1000*60*60*24*365.25)) : 99;
        let vacLista = m.gestante==="Sim" ? VACINAS_GESTANTE : idade<15 ? VACINAS_CRIANCA : idade>=60 ? VACINAS_IDOSO : [];
        if (vacLista.length === 0) return;
        const vac = todasVac[m.id] || {};
        if (vacLista.filter(v => !vac[v]).length > 0) totalPendentes++;
    });
    if (totalPendentes === 0) return;
    const div = document.createElement("div");
    div.style.cssText = "background:#fff5f5;border:1px solid #fc8181;border-left:5px solid #e53e3e;border-radius:10px;padding:14px 18px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;";
    div.innerHTML = `<div style="display:flex;align-items:center;gap:10px;flex:1;"><span style="font-size:26px;">💉</span><div><strong style="color:#742a2a;">${totalPendentes} cidadão(s) com vacinação pendente</strong><div style="font-size:12px;color:#9b2c2c;margin-top:2px;">Verifique o controle de vacinação.</div></div></div>
        <button onclick="window.location.href='vacinacao.html'" style="background:#e53e3e;color:white;border:none;padding:8px 14px;border-radius:6px;font-size:13px;font-weight:bold;cursor:pointer;white-space:nowrap;">Ver vacinação →</button>`;
    container.appendChild(div);
    container.style.display = "block";
}

// ============================================================
//  MELHORIAS — BADGE DE NOTIFICAÇÕES NA SIDEBAR
// ============================================================
function atualizarBadgeNotificacoes() {
    const badge = document.getElementById("badgeNotif");
    if (!badge) return;
    const hoje = new Date();
    let total = 0;
    const lidas = JSON.parse(localStorage.getItem("notifLidas")) || [];
    const visitasMes = visitas.filter(v => { const d=new Date(v.data); return d.getMonth()===hoje.getMonth()&&d.getFullYear()===hoje.getFullYear()&&v.desfecho==="Visita Realizada"; });
    const famVisitadasMes = new Set(visitasMes.map(v => String(v.familiaId)));
    membros.filter(m => m.gestante==="Sim").forEach(m => { if(!famVisitadasMes.has(String(m.familia_id))&&!lidas.includes(`gest_${m.id}`)) total++; });
    membros.filter(m => m.doencas_lista?.includes("Acamado")||m.doencas_lista?.includes("Domiciliado")).forEach(m => {
        const vFam = visitas.filter(v=>v.familiaId==m.familia_id).sort((a,b)=>new Date(b.data)-new Date(a.data));
        const dias = vFam.length ? Math.floor((hoje-new Date(vFam[0].data))/(1000*60*60*24)) : 999;
        if(dias>15&&!lidas.includes(`acamado_${m.id}`)) total++;
    });
    if(!lidas.includes("nunca_visitadas")&&familias.some(f=>!visitas.some(v=>v.familiaId==f.id))) total++;
    if(total>0){badge.textContent=total;badge.style.display="inline";}
    else badge.style.display="none";
}

// ============================================================
//  MELHORIAS — CONTADOR REGRESSIVO DE META
// ============================================================
function calcularDiasUteisRestantesMes() {
    const hoje = new Date();
    const ultimo = new Date(hoje.getFullYear(), hoje.getMonth()+1, 0).getDate();
    let uteis = 0;
    for (let d = hoje.getDate(); d <= ultimo; d++) {
        const dow = new Date(hoje.getFullYear(), hoje.getMonth(), d).getDay();
        if (dow !== 0 && dow !== 6) uteis++;
    }
    return uteis;
}

function atualizarContadorRegressivo() {
    const elCountdown = document.getElementById("metaCountdown");
    if (!elCountdown) return;
    const cfg = JSON.parse(localStorage.getItem("metasConfig2")) || { metaVisitasPct: 80 };
    const hoje = new Date();
    const visitasMes = visitas.filter(v => { const d=new Date(v.data); return d.getMonth()===hoje.getMonth()&&d.getFullYear()===hoje.getFullYear()&&v.desfecho==="Visita Realizada"; });
    const famVisitadasMes = new Set(visitasMes.map(v => String(v.familiaId)));
    const metaFam = Math.ceil(familias.length * (cfg.metaVisitasPct/100));
    const feitas = famVisitadasMes.size;
    const faltam = Math.max(0, metaFam - feitas);
    const pct = metaFam===0?0:Math.min(100,Math.round((feitas/metaFam)*100));
    const diasUteis = calcularDiasUteisRestantesMes();
    if (familias.length===0) { elCountdown.style.display="none"; return; }
    if (pct>=100) {
        elCountdown.style.cssText="display:inline-flex;align-items:center;gap:6px;background:#f0fff4;border:1px solid #68d391;border-radius:999px;padding:5px 12px;font-size:13px;font-weight:600;color:#22543d;margin-top:8px;";
        elCountdown.innerHTML="🏆 Meta atingida! Parabéns!";
    } else {
        const porDia = diasUteis>0 ? Math.ceil(faltam/diasUteis) : faltam;
        const critico = diasUteis<=3;
        elCountdown.style.cssText=`display:inline-flex;align-items:center;gap:6px;background:${critico?"#fff5f5":"#fffbeb"};border:1px solid ${critico?"#fc8181":"#f6ad55"};border-radius:999px;padding:5px 12px;font-size:13px;font-weight:600;color:${critico?"#742a2a":"#744210"};margin-top:8px;`;
        elCountdown.innerHTML=`⏳ Faltam <strong style="margin:0 3px;">${faltam}</strong> visitas · ${diasUteis} dia(s) útil(eis) · <strong style="margin-left:3px;">~${porDia}/dia</strong>`;
    }
}

// ============================================================
//  MELHORIAS — CARDS COLORIDOS NO PAINEL
// ============================================================
function colorirCardsDoPanel() {
    // Card famílias — verde
    const cards = document.querySelectorAll('.card');
    if (!cards.length) return;
    const totalFam = document.getElementById("totalFamilias");
    const totalCid = document.getElementById("totalCidadaos");
    const totalVis = document.getElementById("totalVisitas");
    if (totalFam) totalFam.closest('.card')?.classList.add('card-familias');
    if (totalCid) totalCid.closest('.card')?.classList.add('card-cidadaos');
    if (totalVis) totalVis.closest('.card')?.classList.add('card-visitas');
}

// ============================================================
//  MELHORIAS — HOOK NA INICIALIZAÇÃO
// ============================================================
const _initOriginal = document.addEventListener;
document.addEventListener("DOMContentLoaded", function() {
    // Injeta botão de tema
    injetarBotaoTema();
    // Cards coloridos
    colorirCardsDoPanel();
    // Aniversariantes e vacinação no painel
    verificarAniversariantes();
    verificarVacinacaoPainel();
    // Badge notificações
    atualizarBadgeNotificacoes();
    // Contador regressivo
    atualizarContadorRegressivo();
});

// ------------------------------------
// BOLSA FAMÍLIA — CONDICIONALIDADES
// ------------------------------------
function abrirCondicionalidadesFamilia(familiaId) {
    localStorage.setItem("familiaAtual", familiaId);
    window.location.href = "bolsa_familia.html";
}

function salvarCondicionalidade(familiaId, chave, valor) {
    const todas = JSON.parse(localStorage.getItem("condicionalidades")) || {};
    if (!todas[familiaId]) todas[familiaId] = {};
    todas[familiaId][chave] = valor;
    localStorage.setItem("condicionalidades", JSON.stringify(todas));
}
