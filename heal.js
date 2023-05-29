function heal() {
    let out = document.getElementById('healOutput')
    let inpMoc = document.getElementById('healInpMoc')
    let inpWiedza = document.getElementById('healInpWiedza')
    let inpMod = document.getElementById('healInpMod')
    let inpTarget = document.getElementById('healInpTrg')
    let inpGrp = document.getElementById('healInpGrp')
    let inpRoz = document.getElementById('healInpRoz')
    let inpPswc = document.getElementById('healInpPswc')


    function recalculate() {
        let base = 1.3 * parseInt(inpMoc.value) + .7 * parseInt(inpWiedza.value)

        let mod = parseFloat(inpMod.value) / 200 + 1

        base *= mod


        let trg = parseInt(inpTarget.value) / 100
        let grp = parseInt(inpGrp.value) / 100

        let roz = parseInt(inpRoz.value) / 200 + 1
        let pswc = parseInt(inpPswc.value) / 200 + 1 // TODO


        out.innerHTML = `
        <tr>
            <td>Target</td>
            <td>${Math.ceil(base * trg)}</td>
            <td>${Math.ceil(base * trg * roz)}</td>
            <td>${Math.ceil(base * trg * pswc)}</td>
            <td>${Math.ceil(base * trg * roz * pswc)}</td>
        <tr>

        <tr>
            <td>Grupa</td>
            <td>${Math.ceil(base * grp)}</td>
            <td>${Math.ceil(base * grp * roz)}</td>
            <td>${Math.ceil(base * grp * pswc)}</td>
            <td>${Math.ceil(base * grp * roz * pswc)}</td>
        <tr>
        `
    }

    [inpMoc, inpWiedza, inpMod, inpTarget, inpGrp, inpRoz, inpPswc].forEach(inp => inp.onchange = recalculate)

    recalculate()
}


heal()