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

        let mod = parseFloat(inpMod.value)

        let trg = parseInt(inpTarget.value) / 100
        let grp = parseInt(inpGrp.value) / 100

        let roz = parseInt(inpRoz.value)
        let pswc = parseInt(inpPswc.value)

        let pre = (name, ...args) => args.reduce((a, b) => a + b, 0) / 200 + 1
        let fabric = x => `
        <tr>
            <td>${name}</td>
            <td>${Math.ceil(base * x * pre(mod))}</td>
            <td>${Math.ceil(base * x * pre(mod + roz))}</td>
            <td>${Math.ceil(base * x * pre(mod + pswc))}</td>
            <td>${Math.ceil(base * x * pre(mod + roz + pswc))}</td>
        <tr>`


        out.innerHTML = fabric('Target', trg) + fabric('Grupa', grp)
    }

    [inpMoc, inpWiedza, inpMod, inpTarget, inpGrp, inpRoz, inpPswc].forEach(inp => inp.onchange = recalculate)

    recalculate()
}


heal()