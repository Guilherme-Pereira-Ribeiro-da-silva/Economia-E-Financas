
function CalcularProjemInplantacao(){
    const taxa_livre_de_risco = parseFloat(document.querySelector("#taxa-livre-de-risco-tma-em-implantacao").value);
    const taxa_de_compensacao = parseFloat(document.querySelector("#taxa-compensacao-tma-em-implantacao").value);
    const p_resultado_final = document.querySelector("#em-implantacao-resultado-final");

    if(!(taxa_de_compensacao && taxa_livre_de_risco)){SetarConteudo("Não é possível calcular");return;}

    const resultado_final = (taxa_livre_de_risco + taxa_de_compensacao) + "%";
    SetarConteudo(resultado_final);
    GerarCalculos();

    function SetarConteudo(mensagem){
        const str_msg = "Ki: " + mensagem;
        p_resultado_final.textContent = str_msg;
    }

    function GerarCalculos(){
        const div_calculos = document.querySelector("#Calculos-Em-Implantacao");
        let str_calculo = "<p>Ki = "+ taxa_livre_de_risco +" + "+ taxa_de_compensacao +" = "+ (taxa_livre_de_risco + taxa_de_compensacao) +"</p>";

        div_calculos.innerHTML = str_calculo;
    }
}

function CalcularKE(){
    const taxa_livre_de_risco = parseFloat(document.querySelector("#rf-ke").value);
    const taxa_de_compensacao = parseFloat(document.querySelector("#taxa-de-compensacao-ke").value);
    const beta = parseFloat(document.querySelector("#beta-ke").value);
    const p_resultado_final = document.querySelector("#ke-resultado-final");

    if(!(taxa_livre_de_risco && taxa_de_compensacao && beta)){SetarConteudo("Não foi possível calcular"); return;}
    const resultado_final = (taxa_livre_de_risco + beta * (taxa_de_compensacao - taxa_livre_de_risco)) + "%";
    SetarConteudo(resultado_final);
    GerarCalculos();

    function SetarConteudo(mensagem){
        const str_msg = "Ke: " + mensagem;
        p_resultado_final.textContent = str_msg;
    }

    function GerarCalculos(){
        const div_calculos = document.querySelector("#Calculos-ke");
        let str_calculo = "<p><b>Ke: </b>"+ taxa_livre_de_risco +" + "+ beta +" *("+ taxa_de_compensacao +" - "+ taxa_livre_de_risco +")</p>";
        str_calculo += "<p><b>Ke: </b>"+ taxa_livre_de_risco +" + "+ beta +" *("+ (taxa_de_compensacao - taxa_livre_de_risco) +")</p>";
        str_calculo += "<p><b>Ke: </b>"+ taxa_livre_de_risco +" + "+ (beta * (taxa_de_compensacao - taxa_livre_de_risco)).toFixed(6) +"</p>";
        str_calculo += "<p><b>Ke: </b>"+ (taxa_livre_de_risco + beta * (taxa_de_compensacao - taxa_livre_de_risco)) +"</p>";


        div_calculos.innerHTML = str_calculo;
    }
}

function CalcularTMAAlavancagem(){
    const decimal_porc_terceiros = parseFloat(document.querySelector("#porcentagem-terceiros-tma").value)/100;
    const decimal_porc_propria = parseFloat(document.querySelector("#porcentagem-propria-tma").value)/100;
    const ke = parseFloat(document.querySelector('#ke-tma').value);
    const ki = parseFloat(document.querySelector('#ki-tma').value);
    const p_resultado_final = document.querySelector("#TMA-resultado-final");

    if(!(decimal_porc_propria && decimal_porc_terceiros && ke && ki)){SetarConteudo("Não foi possível calcular");return;}
    const ResultadoFinal = ((ke * decimal_porc_propria  + ki * decimal_porc_terceiros).toFixed(6)) + "%";
    SetarConteudo(ResultadoFinal);
    GerarCalculos();

    function SetarConteudo(mensagem){
        const str_msg = "TMA: " + mensagem;
        p_resultado_final.textContent = str_msg;
    }

    function GerarCalculos(){
        const div_calculos = document.querySelector("#Calculos-alavancagem");

        let str_calculo = "<p><b>TMA: </b>("+ ke +" * "+ decimal_porc_propria +" + "+ ki +" * "+ decimal_porc_terceiros +")</p>";
        str_calculo += "<p><b>TMA: </b>("+ (ke * decimal_porc_propria) +" + "+ (ki * decimal_porc_terceiros) +")</p>";
        str_calculo += "<p><b>TMA: </b>"+ ((ke * decimal_porc_propria) + (ki * decimal_porc_terceiros)).toFixed(6) +"%</p>";

        div_calculos.innerHTML = str_calculo;
    }
}

function MostrarSessao(elemento){
    LimparCalculos();

    const sessoes = [
        document.querySelector("#conteudo-calculo-tma"),
        document.querySelector("#conteudo-calculo-ke"),
        document.querySelector("#conteudo-calculo-alavancado"),
    ];

    sessoes.forEach(sessao => {
       sessao.classList.add('d-none');
    });

    elemento.classList.remove('d-none');
}

function LimparCalculos(){
    document.querySelector("#Calculos-Em-Implantacao").textContent = "Não há nada a calcular";
    document.querySelector("#Calculos-ke").textContent = "Não há nada a calcular";
    document.querySelector("#Calculos-alavancagem").textContent = "Não há nada a calcular";
}