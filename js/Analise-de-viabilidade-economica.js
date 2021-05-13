InicializarVariaveis();

function InicializarVariaveis(){
    const operacoes = JSON.parse(localStorage.getItem("Operacoes"));
    window.Operacoes = [];
    if(operacoes) window.Operacoes = [...operacoes];
    else window.Operacoes = [];
}

function MudarSaldoEVPInicial(NovoValor) {
    const InputSaldoInicial = document.querySelector("#saldo-0");
    const VPInicial = document.querySelector("#vp-inicial");

    InputSaldoInicial.setAttribute('title',NovoValor.toString());
    VPInicial.setAttribute('title',NovoValor.toString());
    InputSaldoInicial.value = NovoValor;
    VPInicial.value = NovoValor;
}

function AdicionarColunaNaTabela(){
    const Tabela = document.querySelector("#corpo-tabela-viabilidade-economica");
    const LinhaAtual = Tabela.rows.length;
    const LinhaDaTabela = document.createElement("tr");
    LinhaDaTabela.classList.add("entrada-suave");
    const Colunas = [];

    const NumColunas = 4;
    for(let i = 0;i < NumColunas;i++) Colunas.push(document.createElement("th"));

    Colunas[0].innerHTML = LinhaAtual;
    Colunas[1].innerHTML = "<input id='fluxo-caixa-"+ LinhaAtual +"' type='number' class='form-control' placeholder='Fluxo de caixa'>";
    Colunas[2].innerHTML = "<input id='VP-"+ LinhaAtual +"' class='form-control' placeholder='VP' disabled>";
    Colunas[3].innerHTML = "<input id='saldo-"+ LinhaAtual +"' class='form-control' placeholder='Saldo Atual' disabled>";

    for(let coluna of Colunas) LinhaDaTabela.appendChild(coluna);

    Tabela.appendChild(LinhaDaTabela);
}

function RemoverColunaDaTabela(){
    const Tabela = document.querySelector("#corpo-tabela-viabilidade-economica");
    const NumLinhas = Tabela.rows.length;

    if(NumLinhas > 1) Tabela.removeChild(Tabela.lastChild);
}

function ApagarTodasColunasTabela(){
    const Tabela = document.querySelector("#corpo-tabela-viabilidade-economica");
    let Tamanho = Tabela.rows.length;

    while (Tamanho > 1){
        Tabela.lastChild.remove();
        Tamanho--;
    }
}

function CalcularValorPresenteLiquido(){
    ErroPadrao(); //mudar conteúdo da div de cálculos para não aparecer o cálculo passado

    const fluxosDeCaixa = [parseFloat(document.querySelector("#fluxo-caixa-0").value)];
    const Tabela = document.querySelector("#corpo-tabela-viabilidade-economica");
    const NumLinhasTabela = Tabela.rows.length;
    const TMA = parseFloat(document.querySelector("#TMA").value);
    let Saldo = parseFloat(document.querySelector("#fluxo-caixa-0").value);
    let StringCalculo = "<p><b>Cálculo base: Fluxo de caixa/(1 + i)^n</b></p>";
    if(!Saldo){return;}

    for(let i = 1;i < NumLinhasTabela;i++){
        let FluxoDeCaixa = parseFloat(document.querySelector("#fluxo-caixa-" + i).value);
        fluxosDeCaixa.push(FluxoDeCaixa);
        if(!FluxoDeCaixa || (!TMA && TMA !== 0)){return;}
        const ValorPresente = FluxoDeCaixa/(Math.pow(1 + TMA/100,i));
        Saldo += ValorPresente;
        const VParrendondado = Math.round((ValorPresente + Number.EPSILON)* 100)/100;
        const Saldoarrendodado = Math.round((Saldo + Number.EPSILON)* 100)/100;

        StringCalculo += "<p><b>Ano " + i + ":</b> " + FluxoDeCaixa + "/(" + 1 + " + " + (TMA/100) + ") ^ " + i + " => " + FluxoDeCaixa + "/" + (Math.pow(1 + TMA/100,i)).toFixed(6)
        + " = (apx) " + VParrendondado + "</p>";

        const InputVP = document.querySelector("#VP-" + i);
        const InputSaldo = document.querySelector("#saldo-" + i);

        InputVP.setAttribute('title',VParrendondado.toString());
        InputSaldo.setAttribute('title',Saldoarrendodado.toString());
        InputVP.value = VParrendondado;
        InputSaldo.value = Saldoarrendodado;
    }

    SetarValorPresenteLiquido(Math.round((Saldo + Number.EPSILON)* 100)/100);
    SetarCalculoValorPresenteLiquido(StringCalculo);

    CalcularPaybackDescontado();
    CalcularTMI();


    const TaxaDeReinvestimento = document.querySelector("#Taxa-de-reinvestimento").value ?
        document.querySelector("#Taxa-de-reinvestimento").value : document.querySelector("#TMA").value;
    const TaxaDeFinanciamento = document.querySelector("#Taxa-de-financiamento").value;
    adicionarOperacao(TMA,fluxosDeCaixa,(window.Operacoes.length + 1), TaxaDeFinanciamento,TaxaDeReinvestimento);
}


function CalcularPaybackDescontado(){
    const Tabela = document.querySelector("#corpo-tabela-viabilidade-economica");
    const NumLinhasTabela = Tabela.rows.length;

    for(let i = 0;i < NumLinhasTabela;i++){
        let Saldo = parseFloat(document.querySelector("#saldo-" + i).value);
        if(Saldo > 0 && i !== 0){
            const UltimoPrejuizo = parseFloat(document.querySelector("#Saldo-" + (i-1)).value);
            const ValorPresente = parseFloat(document.querySelector("#VP-" + i).value);
            const PaybackDescontado = (i - 1) + Math.abs(UltimoPrejuizo)/Math.abs(ValorPresente);

            let StringCalculo = "<p>" + (i - 1) + " + " + Math.abs(UltimoPrejuizo) + "/" + Math.abs(ValorPresente)
            + " = (apx) " + (Math.round((PaybackDescontado + Number.EPSILON)* 100)/100) + "</p>";

            SetarCalculoPaybackDescontado(StringCalculo);

            SetarPaybackDescontado(Math.round((PaybackDescontado + Number.EPSILON)* 100)/100);
            return;
        }
    }

    SetarPaybackDescontado("O projeto em questão não dá payback no tempo analisado");
}

function CalcularTMI(){
    const Tabela = document.querySelector("#corpo-tabela-viabilidade-economica");
    const NumLinhasTabela = Tabela.rows.length;
    const TaxaDeReinvestimento = document.querySelector("#Taxa-de-reinvestimento").value ?
        document.querySelector("#Taxa-de-reinvestimento").value : document.querySelector("#TMA").value;
    const TaxaDeFinanciamento = document.querySelector("#Taxa-de-financiamento").value;
    let FluxoAnteriorFinal = 0;
    let FluxoPosteriorFinal = 0;
    let StringCalculo = "";

    if(!TaxaDeReinvestimento || !TaxaDeFinanciamento){
        let mensagem = "Não foi possível calcular";
        SetarTIR(mensagem);
        SetarCalculoTIR(mensagem);
    }else{
        for(let i = 0;i < NumLinhasTabela;i++){
            const FluxoDeCaixa = document.querySelector("#fluxo-caixa-" + i).value;

            if(FluxoDeCaixa >= 0){
                let FluxoPosterior = FluxoDeCaixa * (1 + TaxaDeReinvestimento/100) ** ((NumLinhasTabela - 1) - i);
                FluxoPosteriorFinal += FluxoPosterior;
                FluxoPosterior = Math.round((FluxoPosterior + Number.EPSILON)* 100)/100;
                StringCalculo += "<p><b>Ano " + i +":</b> " + FluxoDeCaixa + " * " + "(1 + " + (TaxaDeReinvestimento/100) + ") ^ " + ((NumLinhasTabela - 1) - i) + " =>";
                StringCalculo += " " + FluxoDeCaixa + " * " + ((1 + TaxaDeReinvestimento/100) ** ((NumLinhasTabela - 1) - i)).toFixed(6) + " = (apx) " + FluxoPosterior + "</p>";
            }else{
                let FluxoAnterior = (FluxoDeCaixa / ((1 + TaxaDeFinanciamento/100) ** i));
                FluxoAnteriorFinal += FluxoAnterior;
                FluxoAnterior = Math.round((FluxoAnterior + Number.EPSILON)* 100)/100;
                StringCalculo += "<p><b>Ano " + i +":</b> " + FluxoDeCaixa + "/" + "(1 + " + TaxaDeFinanciamento/100 + ") ^ " + i + " =>";
                StringCalculo += " " + FluxoDeCaixa + "/" + ((1 + TaxaDeFinanciamento/100) ** i).toFixed(6) + " = (apx) " + FluxoAnterior;
            }
        }

        StringCalculo += "<p><b>Anterior:</b> (apx) " + Math.round((FluxoAnteriorFinal + Number.EPSILON)* 100)/100 + "</p>";
        StringCalculo += "<p><b>Posterior:</b> (apx) " + Math.round((FluxoPosteriorFinal + Number.EPSILON)* 100)/100 + "</p>";

        const TIRm = (raizqualquer(FluxoPosteriorFinal/FluxoAnteriorFinal,NumLinhasTabela - 1) - 1) * 100;
        const TIRmArredondada = Math.round((TIRm + Number.EPSILON)* 100)/100;
        StringCalculo += "<p><b>Calculo Final:</b> ((√" + (NumLinhasTabela - 1) + "(" + (Math.abs(FluxoPosteriorFinal.toFixed(6))) + "/" + (Math.abs(FluxoAnteriorFinal.toFixed(6))) + ")) - 1) * 100 =>";
        StringCalculo +=" (√" + (NumLinhasTabela - 1) + " " + Math.abs(FluxoPosteriorFinal/FluxoAnteriorFinal).toFixed(6) + ") * 100 =>";
        StringCalculo += " (apx) " + TIRmArredondada + "%</p>";

        SetarTIR(TIRmArredondada + "%");
        SetarCalculoTIR(StringCalculo);
    }

    function raizqualquer(x,n) {
        return Math.pow(Math.abs(x), 1/n);
    }
}

function ErroPadrao(){
    const ConteudoErroPadrao = "Não foi possível calcular";
    SetarPaybackDescontado(ConteudoErroPadrao);
    SetarValorPresenteLiquido(ConteudoErroPadrao);
    SetarCalculoValorPresenteLiquido(ConteudoErroPadrao);
    SetarCalculoPaybackDescontado(ConteudoErroPadrao);
    SetarTIR(ConteudoErroPadrao);
    SetarCalculoTIR(ConteudoErroPadrao);
}

function LimparTabelaECalculosAnaliseEconomica() {
    const SectionAnaliseEconomica = document.querySelector("#analise-viabilidade-economica");
    const InputsSectionAE = SectionAnaliseEconomica.querySelectorAll("input");
    for(let input of InputsSectionAE) input.value = "";

    const mensagem = "Não há nada a calcular";
    SetarCalculoPaybackDescontado(mensagem);
    SetarCalculoValorPresenteLiquido(mensagem);
    SetarPaybackDescontado(mensagem);
    SetarValorPresenteLiquido(mensagem);
    SetarTIR(mensagem);
    SetarCalculoTIR(mensagem);
}

function SetarCalculoValorPresenteLiquido(conteudo){
    document.querySelector("#Calculos-VPL").innerHTML = conteudo;
}

function SetarCalculoPaybackDescontado(conteudo){
    document.querySelector("#Calculos-PD").innerHTML = conteudo;
}

function SetarCalculoTIR(conteudo){
    document.querySelector("#Calculos-TIR").innerHTML = conteudo;
}

function SetarValorPresenteLiquido(conteudo){
    document.querySelector("#valor-presente-liquido").textContent = "Valor Presente Líquido: " + conteudo;
}

function SetarPaybackDescontado(conteudo){
    document.querySelector("#payback-descontado").textContent = "Payback Descontado: " + conteudo;
}

function SetarTIR(conteudo){
    document.querySelector("#TIR").textContent = "Taxa interna de retorno: " + conteudo;
}


function adicionarOperacao(TMA,Fluxos,id,TF,TR){
    for(let Operacao of Operacoes){
        if(Operacao.tma === TMA && ArraysSaoIguais(Fluxos,Operacao.Fluxos) && TF === Operacao.TF && TR === Operacao.TR) return;
    }

    const operacao = {
        id: id,
        tma: TMA,
        Fluxos: Fluxos,
        TF: TF,
        TR: TR
    }
    Operacoes.push(operacao);
    localStorage.setItem("Operacoes",JSON.stringify(Operacoes));
}

function ArraysSaoIguais(a,b){
    if(a.length !== b.length) return false;

    for (let i = 0;i < a.length;i++){
        if(a[i] !== b[i]) return false;
    }

    return true;
}

function HistoricoAnaliseViabilidadeProjetos(icone){
   VirarIcone(icone);
   const UlOperacoes = document.querySelector("#historico-analise-viabilidade-economica");

   if(UlOperacoes.children.length > 0){
       const TamanhoInicial = UlOperacoes.children.length;
       const intervalo = setInterval(() => {
           if(UlOperacoes.children.length > 0) UlOperacoes.lastChild.remove();
       },100);

       setTimeout(() => {
            clearInterval(intervalo);
       },(TamanhoInicial * 100) + 100);
   }else{
       if(Operacoes.length === 0) UlOperacoes.innerHTML = "<p class='entrada-suave'>Não existem operações salvas</p>";

       for(let i = Operacoes.length - 1;i >= 0;i--){
           setTimeout(() => {
               const operacao = Operacoes[i];
               let LiOperacao = document.createElement("li");
               LiOperacao.classList.add("entrada-suave")

               LiOperacao.setAttribute("id","analise-viabilidade-economica-historico-" + i);
               LiOperacao.innerHTML = "Id: " + operacao.id +";TMA: " + operacao.tma + "%; Fluxo inicial: " + operacao.Fluxos[0] + ";Taxa de Financiamento: " + operacao.TF + "%" +
                   " <i class='fa fa-refresh fa-lg icone-cliclavel' aria-hidden='true' onclick='ResetarOperacao("+ i +")'></i>";

               UlOperacoes.appendChild(LiOperacao);
           },250);
       }
   }
}

function VirarIcone(icone) {
    if(!icone.classList.contains("virar-de-ponta-cabeca")){
        icone.classList.add("virar-de-ponta-cabeca");
    }else{
        let direcaoIcone;
        let direcaoContrariaIcone;
        if(icone.classList.contains("fa-arrow-down")){
            direcaoIcone = "fa-arrow-down";
            direcaoContrariaIcone = "fa-arrow-up";
        }else{
            direcaoIcone = "fa-arrow-up";
            direcaoContrariaIcone = "fa-arrow-down";
        }

        icone.classList.remove(direcaoIcone,"virar-de-ponta-cabeca");
        icone.classList.add(direcaoContrariaIcone);
        setTimeout(() => {
            icone.classList.add("virar-de-ponta-cabeca");
        },50);
    }
}

function ResetarOperacao(id){
    LimparTabelaECalculosAnaliseEconomica();

    const Operacao = Operacoes[id];
    ApagarTodasColunasTabela();

    const InputTMA = document.querySelector("#TMA");
    InputTMA.value = Operacao.tma;

    const fluxoInicial = document.querySelector("#fluxo-caixa-0");
    fluxoInicial.value = Operacao.Fluxos[0];

    const SaldoInicial = document.querySelector("#saldo-0");
    SaldoInicial.value = Operacao.Fluxos[0];

    const VPInicial = document.querySelector("#vp-inicial");
    VPInicial.value = Operacao.Fluxos[0];

    const TaxaDeFinanciamento = document.querySelector("#Taxa-de-financiamento");
    TaxaDeFinanciamento.value = Operacao.TF;

    const TaxaDeReinvestimento = document.querySelector("#Taxa-de-reinvestimento");
    TaxaDeReinvestimento.value = Operacao.TR;

    for(let i = 1;i < Operacao.Fluxos.length;i++){
        AdicionarColunaNaTabela();
        const InputColuna = document.querySelector("#fluxo-caixa-" + i);
        InputColuna.value = Operacao.Fluxos[i];
    }

    const BotaoCalcular = document.querySelector("#btn-calcular-analise-viabilidade-projeto");
    BotaoCalcular.click();

    const BotaoQueLevaPraTabela = document.querySelector("#analise-e-viabilidade-de-projetos");
    BotaoQueLevaPraTabela.click();
}

