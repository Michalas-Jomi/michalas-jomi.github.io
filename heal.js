function heal() {
    let out = document.getElementById('healOutput')
    let out2 = document.getElementById('healOutput2')
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

        let pre = (...args) => args.reduce((a, b) => a + b, 0) / 200 + 1
        let fabric = (name, x) => `
        <tr>
            <td>${name}</td>
            <td>${Math.ceil(base * x * pre(mod))}</td>
            <td>${Math.ceil(base * x * pre(mod + roz))}</td>
            <td>${Math.ceil(base * x * pre(mod + pswc))}</td>
            <td>${Math.ceil(base * x * pre(mod + roz + pswc))}</td>
        <tr>`

        out.innerHTML = fabric('Target', trg) + fabric('Grupa', grp)

        let g = Math.ceil(base * grp * pre(mod + roz))
        let t = Math.ceil(base * trg * pre(mod + roz))

        out2.innerHTML = ''
        for (let i = 0; i <= 5; i++) {
            let i1 = .1 * i
            let i2 = .2 * i
            let i3 = .3 * i
            out2.innerHTML += `<tr>
                    <td>${i}</td>
                    <td>${Math.ceil(g * (1.0 - i1))}</td>
                    <td>${Math.ceil(t * (1.0 - i1))}</td>
                    <td>${Math.ceil(g * (1.9 - i2))}</td>
                    <td>${Math.ceil(g * (1.0 - i1) + t * (.9 - i1))}</td>
                    <td>${Math.ceil(t * (1.8 - i2))}</td>
                    <td>${Math.ceil(g * (2.7 - i3))}</td>
                    <td>${Math.ceil(g * (1.9 - i2) + t * (.8 - i1))}</td>
                    <td>${Math.ceil(g * (1.0 - i1) + t * (1.6 - i2))}</td>
                    <td>${Math.ceil(t * (2.4 - i3))}</td>
                </tr>`
        }
    }

    [inpMoc, inpWiedza, inpMod, inpTarget, inpGrp, inpRoz, inpPswc].forEach(inp => inp.onchange = recalculate)

    recalculate()
}


heal()