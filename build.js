class Build {
    static calculate() {
            let map = {}
            let counter = {}
            let effects = []

            // zbieranie danych
            for (let slot of GUI.eqSlots)
                if (slot.item != null)
                    for (let driffSlot of slot.item.driffs) {
                        let driff = driffSlot.driff
                        if (driff == null)
                            continue

                        if (driff.data.fullname in map)
                            map[driff.data.fullname] += driff.effekt()
                        else
                            map[driff.data.fullname] = driff.effekt()

                        if (driff.data.fullname in counter)
                            counter[driff.data.fullname] += 1
                        else
                            counter[driff.data.fullname] = 1
                    }

            for (let key in map) {
                let data = DriffData.driffs[key]
                effects.push(new Effect(data, map[key], counter[key]))
            }


            GUI.show(effects)
        }
        /**
         * 
         * @param {Array<Effect>} effects 
         */
    static _calcPower(effects) {
        let power = 0

        // TODO staty, resy itp

        for (let effect of effects) {
            power += effect.effect / effect.data.amp * Math.pow(effect.data.pow)
        }
    }

    /**
     * Zapisuje cały workspace jako linijke tekstu
     * @returns {String}
     */
    static save() {
        /*
        let saveDriff = driff => {
            if (driff == null)
                return 0

            let map = {}

            map.a = driff.lvl
            map.b = driff.tier
            map.c = driff.data.name

            return map
        }
        let saveItem = item => {
            if (item == null)
                return 0

            let map = {}

            map.a = item.data.type
            map.b = item.data.name

            map.c = []
            for (let driff of item.driffs)
                map.c.push(driff.driff == null ? 0 : saveDriff(driff.driff))

            return map
        }
        let saveSlot = slot => {
            if (slot.type == null && slot.item == null)
                return 0

            let map = {}

            map.a = slot.type
            map.b = saveItem(slot.item)

            return map
        }*/

        let saveDriff = driff => {
            if (driff == null)
                return '-'

            return Build.NumToLet(driff.data.id, 2) +
                Build.NumToLet(driff.lvl, 1) +
                Build.NumToLet(driff.tier, 1)
        }
        let saveItem = item => {
            if (item == null)
                return '-'

            let w = Build.NumToLet(item.data.id, 2)

            for (let driff of item.driffs)
                w += (driff.driff == null ? '-' : saveDriff(driff.driff))

            return w
        }
        let saveSlot = slot => {
            if (slot.type == null && slot.item == null)
                return '-'

            let w = Build.NumToLet(Type.getId(slot.type), 1) +
                saveItem(slot.item)

            return w
        }


        let w = ''

        for (let slot of GUI.eqSlots)
            w += saveSlot(slot)
        for (let slot of GUI.invSlots)
            w += saveSlot(slot)

        // compressing

        let w2 = ''
        let last = ''
        let count = 0
        let add = () => {
            if (count > 1)
                w2 += count.toString() + last
            else
                w2 += last
        }
        for (let i of w) {
            if (i == last) {
                count++
            } else {
                add()
                last = i
                count = 1
            }
        }
        add()


        return w2
    }

    /**
     * Wczytuje cały workspace z linijki tekstu
     * @param {String} data 
     * @returns {Boolean} powodzenie
     */
    static load(str) {
        try {
            if (str[0] == 'e') {
                Build.loadOld(str)
                return true
            }
        } catch {}

        // decompressing

        str = str.replaceAll(/(\d+)(.)/g, (_, count, char) => char.repeat(parseInt(count)))


        // prepare loading

        let x = 0

        let is0 = () => str[x] == '-' ? ++x > 0 : false
        let get1 = () => Build.LetToNum(str[x++])
        let get2 = () => Build.LetToNum(str[x++] + str[x++])

        let loadDriff = (driffSlot) => {
            if (is0())
                return null

            let data = DriffData.fromId(get2())
            let lvl = get1()
            let tier = get1()

            return new Driff(data, driffSlot, lvl, tier)
        }
        let loadItem = () => {
            if (is0())
                return null

            let data = GUIItemData.fromId(get2())

            let item = new GUIItem(data)

            let slots = GUIItem.caps[data.rank][1]
            for (let i = 0; i < slots; i++)
                item.driffs[i].setDriff(loadDriff(item.driffs[i]))

            return item
        }
        let loadSlot = () => {
            if (is0())
                return new GUISlot(null)

            let type = Type.getName(get1())
            let item = loadItem()

            let slot = new GUISlot(type)
            slot.insertItem(item)

            return slot
        }

        // reset

        Build.clearGUI()


        // loading

        for (let i = 0; i < 12; i++)
            GUI.addEqSlot(loadSlot())
        while (x < str.length)
            GUI.addInvSlot(loadSlot())


        Build.calculate()

        return true
    }

    /**
     * Wczytuje cały workspace z linijki tekstu w starej wersji
     * @param {String} data 
     * @returns {Boolean} powodzenie
     */
    static loadOld(data) {
        let loadDriff = (map, driffSlot) => {
            if (map == 0)
                return null

            let lvl = map.a
            let tier = map.b
            let data = DriffData.fromName(map.c)

            return new Driff(data, driffSlot, lvl, tier)
        }
        let loadItem = (map) => {
            if (map == 0)
                return null

            let dataType = map.a
            let dataName = map.b

            let item = new GUIItem(GUIItemData.getData(dataType, dataName))
            for (let i = 0; i < map.c.length; i++)
                item.driffs[i].setDriff(loadDriff(map.c[i], item.driffs[i]))

            return item
        }
        let loadSlot = map => {
            if (map == 0)
                return new GUISlot(null)
            let type = map.a
            let item = loadItem(map.b)

            let slot = new GUISlot(type)
            slot.insertItem(item)

            return slot
        }

        let map;
        try {
            map = JSON.parse(atob(data))
        } catch {
            return false
        }


        // reset

        Build.clearGUI()


        // loading

        for (let jsonSlot of map.eq)
            GUI.addEqSlot(loadSlot(jsonSlot))
        for (let jsonSlot of map.inv)
            GUI.addInvSlot(loadSlot(jsonSlot))


        Build.calculate()

        return true
    }

    static clearGUI() {
        for (let slot of GUI.invSlots)
            slot.insertItem(null)
        for (let slot of GUI.eqSlots)
            slot.insertItem(null)
        GUIConf.edit(null)

        Build.calculate()

        GUI.invSlots.splice(0, GUI.invSlots.length)
        GUI.eqSlots.splice(0, GUI.eqSlots.length)

        GUI.inv.innerHTML = ''
        GUI.eq.innerHTML = ''
    }


    /**
     * zamienia liczbe w systniemie 10 na system 26 uzywający samych małych liter
     * @param {Number} num 
     * @param {Number} len 
     * @returns {String}
     */
    static NumToLet(num, len) {
        let w = ''

        while (num > 0) {
            w = String.fromCharCode(num % 26 + 97) + w
            num = parseInt(num / 26)
        }

        while (w.length < len)
            w = 'a' + w

        return w
    }

    /**
     * zamienia liczbe w systemie 26 z samymi małymi literami alfabetu na zwykła liczbę systemu 10
     * @param {String} letter
     * @returns {Number} 
     */
    static LetToNum(letter) {
        let w = 0

        for (let i = 0; i < letter.length; i++) {
            let x = letter.charCodeAt(i) - 97
            w += Math.pow(26, letter.length - i - 1) * x
        }

        return w
    }
}

class Info {
    static copyDiv = document.getElementById('buildCopyContainer')
    static msgDiv = document.getElementById('buildDialog')

    /**
     * Wyświetla przez time sekund wiadomość w rogu ekranu
     * @param {String} msg wiadomość
     * @param {Number} time sekundy wyświetlania 
     */
    static showMessage(msg, time = 3) {
        let makeDiv = () => {
            let div = document.createElement('div')
            div.setAttribute('class', 'buildDialogMessage')
            div.innerText = msg
            return div
        }
        let animDiv = div => {
            let bot = div.style.getPropertyValue('bottom')
            bot = parseInt(bot)
            if (bot >= 0) {
                setTimeout(() => Info.msgDiv.removeChild(div), time * 1000)
                return
            }

            for (let child of Info.msgDiv.children) {
                let x = child.style.getPropertyValue('bottom')
                x = parseInt(x) + 1
                child.style.setProperty('bottom', x.toString() + 'px')
            }

            setTimeout(() => animDiv(div), 2)
        }

        let div = makeDiv()
        Info.msgDiv.appendChild(div)

        div.style.setProperty('bottom', `-${div.offsetHeight + 20}px`)
        div.style.setProperty('opacity', '.8')

        animDiv(div)
    }

    /**
     * Otwiera okno z wiadomością do skopiowania
     * @param {String} msg 
     */
    static copy(msg) {
        let close = Info.copyDiv.children[0]
        let input = Info.copyDiv.children[1]
        let copy = Info.copyDiv.children[2]


        Info.copyDiv.style.setProperty('display', 'block')
        GUI.body.style.setProperty('display', 'none')
        input.value = msg // textarea

        close.onclick = () => {
            Info.copyDiv.style.setProperty('display', 'none')
            GUI.body.style.setProperty('display', 'block')
        }

        copy.onclick = () => {
            input.select();
            input.setSelectionRange(0, 99999); // for mobile devices

            navigator.clipboard.writeText(msg).then(() => {
                console.log('skopiowano do schowka:')
                console.log(msg)
                Info.showMessage('Skopiowano')
            })

            close.onclick()
        }
    }
}

class Type {
    static types = ['Amulety', 'Bron', 'Buty', 'Helmy', 'Pierki', 'Paski', 'Rekawice', 'Tarcze Karwasze', 'Zbroje', 'Peleryny', 'Spodnie']

    static getId(name) {
        let i = Type.types.indexOf(name)
        return (i == -1) ? 25 : i
    }
    static getName(id) {
        return (id == 25) ? null : Type.types[id]
    }
}


class DriffData {
    static __id = 0
    static driffs = {}

    constructor(name, fullname, amp, pow, max, type) {
        this.id = DriffData.__id++;
        this.fullname = fullname
        this.name = name
        this.pow = pow
        this.amp = amp
        this.max = max
        this.type = type

        DriffData.driffs[this.fullname] = this
    }

    geticonMod() {
        return 'icons/driffs/mody/' + this.name + '.png'
    }
    getIconSlot(tier) {
        tier = 'SBMA' [tier - 1]
        return 'icons/driffs/sloty/' + this.type + '/slot' + tier + '.png'
    }

    /**
     * 
     * @param {String} name 
     * @returns {DriffData}
     */
    static fromName(name) {
        for (let driff of Object.values(DriffData.driffs))
            if (driff.name == name)
                return driff
        return null
    }

    /**
     * 
     * @param {Number} id 
     * @returns {DriffData}
     */
    static fromId(id) {
        for (let data of Object.values(DriffData.driffs))
            if (data.id == id)
                return data
        return null
    }
}
class Driff {
    /**
     * 
     * @param {DriffData} data 
     * @param {GUIDriffSlot} slot
     * @param {number} lvl 
     * @param {number} tier 
     */
    constructor(data, slot, lvl = 1, tier = 1) {
        this.data = data
        this.slot = slot
        this.tier = parseInt(tier)
        this.lvl = parseInt(lvl)

        this.checkCalc()

        this.container = document.createElement('div')
        this.container.setAttribute('class', 'buildDriff')

        this.imgSlot = document.createElement('img')
        this.imgIcon = document.createElement('img')

        this.imgSlot.setAttribute('class', 'buildDriffSlot')
        this.imgIcon.setAttribute('class', 'buildDriffIcon')

        this.container.appendChild(this.imgSlot)
        this.container.appendChild(this.imgIcon)


        this.refreshGUI()
    }

    refreshGUI() {
        this.imgSlot.src = this.data.getIconSlot(this.tier)
        this.imgIcon.src = this.data.geticonMod()
    }

    /**
     * 
     * @returns {HTMLImageElement}
     */
    getGUI() {
        return this.container
    }

    /**
     * 
     * @param {number} lvl 
     */
    setLvl(lvl) {
        if (this.lvl == lvl)
            return
        this.lvl = lvl

        this.checkCalc()
    }

    /**
     * 
     * @param {number} tier 
     */
    setTier(tier) {
        if (this.tier == tier)
            return
        this.tier = tier

        this.checkCalc()
        this.refreshGUI()
    }

    checkCalc() {
        if (this.slot.item.slot != null && this.slot.item.slot.isEq())
            Build.calculate()
    }

    power() {
        return this.data.pow * this.tier
    }
    effekt() {
        let x = this.tier + this.lvl - 1
        if (this.lvl >= 19)
            x += this.lvl - 18
        return this.data.amp * x * (this.slot.item.data.epik ? 1.6 : 1)
    }

}

class Effect {
    /**
     * 
     * @param {DriffData} data 
     * @param {number} rawEffect 
     * @param {number} count 
     */
    constructor(data, rawEffect, count) {
        this.rawEffect = rawEffect
        this.effect = rawEffect
        this.count = count
        this.data = data

        // kary za liczebność
        if (count > 3) {
            let amp;

            if (count > 7) {
                amp = .74
                console.log('driffów ' + key + ' jest ' + count + ', nieznany mnożnik, licze jak przy 7')
            } else
                amp = [1, 1, 1, .95, .87, .8, .74][count - 1]

            this.effect *= amp
        }

        // limity
        if (!isNaN(data.max) && data.max != null)
            this.effect = Math.min(data.max, this.effect)
    }
}


class GUI {
    static body = document.getElementById('build')
    static eq = document.getElementById('buildeq')
    static inv = document.getElementById('buildinv')
    static select = document.getElementById('buildItemSlectDiv')
    static info = document.getElementById('buildinfo')
    static conf = document.getElementById('buildconf')
    static foot = document.getElementById('buildfoot')

    static eqSlots = []
    static invSlots = []

    static init() {
        // Sloty
        for (let type of Array.of('Bron', 'Tarcze Karwasze', 'Peleryny', 'Helmy', 'Rekawice', 'Zbroje', 'Paski', 'Spodnie', 'Amulety', 'Buty', 'Pierki', 'Pierki'))
            this.addEqSlot(new GUISlot(type))

        for (let i = 0; i < 32; i++)
            GUI.addInvSlot(new GUISlot(null))

        // Conf
        GUIConf.init()

        GUI._makeEpiks()
    }
    static _makeEpiks() {
        let fabric = (name, mod) => {
            let item = new GUIItem(GUIItemData.getData('Bron', name))

            item.driffs[0].setDriff(new Driff(DriffData.fromName('band'), item.driffs[0], 1, 3))
            item.driffs[1].setDriff(new Driff(DriffData.fromName(mod), item.driffs[1], 1, 3))

            return item
        }

        GUI.addToInv(fabric('allenor', 'astah'))
        GUI.addToInv(fabric('attawa', 'oda'))
        GUI.addToInv(fabric('gorthdar', 'unn'))
        GUI.addToInv(fabric('imisindo', 'ling'))
        GUI.addToInv(fabric('latarnia_zycia', 'Err'))
        GUI.addToInv(fabric('washi', 'ulk'))
        GUI.addToInv(fabric('zmij', 'teld'))
    }

    /**
     * 
     * @param {GUISlot} slot
     */
    static addInvSlot(slot) {
        GUI.invSlots.push(slot)
        GUI.inv.appendChild(slot.get())
    }

    /**
     * 
     * @param {GUISlot} slot
     */
    static addEqSlot(slot) {
        GUI.eqSlots.push(slot)
        GUI.eq.appendChild(slot.get())
    }

    /**
     * 
     * @param {GUIItem} item 
     */
    static addToInv(item) {
        for (let i = 0; i < GUI.invSlots.length; i++) {
            if (GUI.invSlots[i].item == null) {
                GUI.invSlots[i].insertItem(item)
                return
            }
        }

        let slot = new GUISlot(null)
        GUI.addInvSlot(slot)
        slot.insertItem(item)
    }

    /**
     * Wyświetla aktualne modyfikatory
     * @param {Array<Effect>} effects 
     */
    static show(effects) {
        GUI.info.innerHTML = ''

        let make = (color, text) => `<span style='color: ${color};'>${text}</span>`

        for (let effect of effects) {
            GUI.info.innerHTML += '<div>'

            GUI.info.innerHTML += make('white', `|${effect.count}x| `)
            GUI.info.innerHTML += make('lightblue', `${effect.data.fullname} `)
            GUI.info.innerHTML += make('lightblue', `${Math.round(effect.effect*100)/100}% `)
            if (effect.count > 3)
                GUI.info.innerHTML += make('white', `(suma ${effect.rawEffect}%)`)

            GUI.info.innerHTML += '</div>'
        }
    }
}

class GUIConf {
    /** @type {GUIItem} */
    static editItem = null
    static divs = {
        save: {
            main: document.getElementById('buildSaveLoad'),

            save: document.getElementById('buildSave'),
            load: document.getElementById('buildLoad'),
        },

        nav: {
            make: document.getElementById('buildConfNavMake'),
            save: document.getElementById('buildConfNavSave'),
        },

        edit: {
            main: document.getElementById('buildEditItemDiv'),

            info: document.getElementById('buildInfoDiv'),

            close: document.getElementById('buildEditClose'),

            driffs: document.getElementById('buildEditDriffs'),
        }
    }

    static init() {
        GUIConf.divs.edit.close.onclick = () => GUIConf.edit(null)

        GUIConf.divs.save.save.onclick = () => {
            console.log('zapisywanie buildu')

            let data = Build.save()

            Info.copy(data)
        }
        GUIConf.divs.save.load.onclick = () => {
            console.log('wczytywanie buildu')
            navigator.clipboard.readText().then(data => {
                if (Build.load(data))
                    Info.showMessage('wczytano build')
                else
                    Info.showMessage('Nie udało sie wczytać buildu ze schowka')
            })

        }

        GUIConf.divs.nav.make.onclick = () => {
            if (GUI.select.style.getPropertyValue('display') == 'block')
                GUIConf.closeSelect()
            else
                GUIConf.openSelect()
        }
        GUIConf.divs.nav.save.onclick = () => {
            if (GUIConf.editItem != null)
                GUIConf.edit(null)

            this.divs.save.main.style.setProperty('display', 'block')
        }

        GUIConf._makeSelect()
    }
    static _makeSelect() {
        GUI.select.style.setProperty('display', 'none')

        let head = document.createElement('div')
        let bodies = document.createElement('div')
        GUI.select.appendChild(head)
        GUI.select.appendChild(bodies)


        for (let type in GUIItemData.items) {
            let body = document.createElement('div')

            body.style.setProperty('display', 'none')

            let icon = document.createElement('div')
            icon.setAttribute('class', 'buildSelectCatIcon')
            icon.style.setProperty('background-image', `url('icons/eq${type}.png')`)

            head.appendChild(icon)
            bodies.appendChild(body)

            icon.onclick = ev => {
                for (let b of bodies.children)
                    b.style.setProperty('display', 'none')
                body.style.setProperty('display', 'block')
            }

            for (let itemData of GUIItemData.items[type]) {
                if (itemData.epik)
                    continue
                let item = new GUIItem(itemData)
                let slot = new GUISlot(null)
                slot.container.onclick = null

                slot.insertItem(item)

                body.appendChild(slot.get())

                item.container.onclick = ev => {
                    let item = new GUIItem(itemData)
                    GUIConf.closeSelect()
                    GUI.addToInv(item)
                    GUIConf.edit(item)
                }
            }

        }

        bodies.children[1].style.setProperty('display', 'block')
    }

    static openSelect() {
        if (GUIConf.editItem != null)
            GUIConf.edit(null)
        GUI.inv.style.setProperty('display', 'none')
        GUI.select.style.setProperty('display', 'block')
        GUIConf.divs.nav.make.style.setProperty('background-color', 'green')
    }
    static closeSelect() {
        GUI.inv.style.setProperty('display', 'block')
        GUI.select.style.setProperty('display', 'none')
        GUIConf.divs.nav.make.style.setProperty('background-color', null)
    }

    /**
     * 
     * @param {GUIItem} item 
     */
    static edit(item) {
        if (GUIConf.editItem != null)
            GUIConf.editItem.slot.setActive(false)

        GUIConf.editItem = item
        if (item != null) {
            GUIConf.divs.edit.main.style.setProperty('display', 'block')
            this.divs.save.main.style.setProperty('display', 'none')

            item.slot.setActive(true)

            GUIConf.divs.edit.driffs.innerHTML = ''
            for (let driff of item.driffs)
                GUIConf.divs.edit.driffs.appendChild(driff.getForm())
        } else
            GUIConf.divs.edit.main.style.setProperty('display', 'none')

        GUIConf.setInfo()
    }

    /**
     * uzupełnia div#buildEditInfo
     */
    static setInfo() {
        let html = ''

        if (GUIConf.editItem != null) {
            let color = (color, text) => `<span style='color: ${color}'>${text}</span>`

            let data = GUIConf.editItem.data
            html = `
                <h2>
                    <img src='${data.getImgSrc()}'>
                    ${data.fullname} [${data.rank}]
                </h2>
                <h3>Pojemność: ${GUIConf.editItem.calcPower()}/${GUIItem.caps[data.rank][0]}</h3>
                `
            for (let i = 0; i < GUIConf.editItem.driffs.length; i++) {
                let driff = GUIConf.editItem.driffs[i]
                let text
                if (driff.driff == null)
                    text = 'Brak'
                else {
                    text = ['Subdrif', 'Bidrif', 'Magnidrif', 'ArcyDrif'][driff.driff.tier - 1]
                    text += ` ${driff.driff.data.name}`
                    text = color('lightblue', text)
                    text += color('white', ` [${driff.driff.lvl}]`)
                }

                html += `<h3>Slot ${i+1}: ${text} </h3>`
            }
        }

        GUIConf.divs.edit.info.innerHTML = html
    }
}

class GUISlot {
    /**
     * 
     * @param {String} type 
     */
    constructor(type) {
        this.type = type
        this.item = null

        this.container = document.createElement('div')
        this.container.setAttribute('class', 'GUISlot')

        this.body = document.createElement('div')

        this.container.appendChild(this.body)

        this.setActive(false)

        if (this.type != null)
            this.setBackgorund(`icons/eq${this.type}.png`)


        this.container.onclick = ev => {
            if (GUIConf.editItem == null)
                return

            let calc = GUIConf.editItem.slot.isEq()

            if (!this.insertItem(GUIConf.editItem))
                return

            if (calc || this.isEq())
                Build.calculate()
        }
    }

    /**
     * 
     * @param {Boolean} active 
     */
    setActive(active) {
        this.container.style.setProperty('background-color', active ? '#90900050' : '#00000050')
    }

    /**
     * 
     * @returns {Boolean}
     */
    isActive() {
        return this.container.style.getPropertyValue('background-color') == 'rgba(144, 144, 0, 0.314)'
    }

    /**
     * 
     * Zwraca true jeśli slot należy do slotów eq i należy wliczać jego efekt
     * @returns {Boolean}
     */
    isEq() {
        return this.type != null
    }

    /**
     * 
     * @returns {HTMLDivElement }
     */
    get() {
        return this.container
    }

    /**
     * 
     * @param {GUIItem} item 
     * @returns {Boolean}
     */
    insertItem(item) {
        if (this.item === item)
            return

        if (item == null) {
            if (this.item != null)
                this.item.slot = null
            this.body.innerHTML = ''
            this.item = null
        } else if (this.type != null && item.data.type != this.type)
            return false
        else {
            if (this.item != null) {
                this.item.slot = null

                let active = this.isActive()
                this.setActive(false)
                let _item = this.item
                GUI.addToInv(this.item)
                _item.slot.setActive(active)
            }
            if (item.slot != null) {
                this.setActive(item.slot.isActive())
                item.slot.setActive(false)
                item.slot.insertItem(null)
            }
            this.item = item
            this.item.slot = this
            this.body.innerHTML = ''
            this.body.appendChild(item.get())
            this.item.refreshGUIDriffs()
        }

        if (this.isEq())
            Build.calculate()

        return true
    }

    /**
     * 
     * @param {String} src url(src)
     */
    setBackgorund(src) {
        this.container.style.setProperty('background-image', `url('${src}')`)
        this.container.style.setProperty('background-size', '90px')
    }
}
class GUIDriffSlot {
    /**
     * 
     * @param {GUIItem} item 
     */
    constructor(item) {
        this.container = document.createElement('div')
        this.container.setAttribute('class', 'GUIDriffSlot')

        this.driff = null
        this.item = item

        this.form = null

        this.inpMod = null
        this.inpLvl = null
        this.inpTier = null

        this.refreshGUI()
    }

    refreshGUI() {
        this.container.innerHTML = ''

        let shape
        let color
        if (this.driff == null) {
            shape = null
            color = null
        } else {
            shape = 'unset'
            color = 'unset'
            this.driff.refreshGUI()
            this.container.appendChild(this.driff.getGUI())
        }

        this.container.style.setProperty('clip-path', shape)
        this.container.style.setProperty('background-color', color)
    }

    setDriff(driff) {
        this.driff = driff
        this.refreshGUI()
    }

    getForm() {
        if (this.form != null)
            return this.form

        this._buildForm()

        // Functional
        this.inpTier.onchange = ev => {
            let val = parseInt(this.inpTier.value)
            if (1 > val || val > this.inpTier.getAttribute('max')) {
                this.inpTier.value = '1'
                val = 1
            }
            if (this.driff != null) {
                let lastVal = this.driff.tier
                this.driff.setTier(val)
                if (lastVal < val && this.item.overPower()) {
                    this.inpTier.value = lastVal
                    this.driff.setTier(lastVal)
                    return
                }
            }

            let mx = [6, 11, 16, 21][val - 1]
            this.inpLvl.setAttribute('max', mx)
            if (this.inpLvl.value > mx) {
                this.inpLvl.value = mx
                this.inpLvl.onchange(null)
            }

            this.refreshGUI()
            GUIConf.setInfo()
        }
        this.inpLvl.onchange = ev => {
            let val = parseInt(this.inpLvl.value)
            if (1 > val || val > this.inpLvl.getAttribute('max')) {
                this.inpLvl.value = '1'
                val = 1
            }

            if (this.driff != null)
                this.driff.setLvl(val)

            GUIConf.setInfo()
        }
        this.inpMod.onchange = ev => {
            let data = DriffData.driffs[this.inpMod.value]
            if (!data) {
                if (this.driff != null)
                    this.setDriff(null)
            } else {
                let undo = false
                for (let driffSlot of this.item.driffs) {
                    if (driffSlot !== this)
                        if (undo = (undo || (driffSlot.driff != null && driffSlot.driff.data === data)))
                            break
                }
                let undoDriff = this.driff
                this.setDriff(new Driff(data, this, this.inpLvl.value, this.inpTier.value))

                if (!undo)
                    undo = this.item.overPower()

                if (undo) {
                    this.inpMod.value = undoDriff == null ? '' : undoDriff.data.fullname
                    this.setDriff(undoDriff)
                }
            }

            if (this.item.slot.isEq())
                Build.calculate()

            this.refreshGUI()

            GUIConf.setInfo()
        }

        if (this.item.data.epik) {
            this.inpTier.disabled = true
            this.inpMod.disabled = true
        }

        return this.form
    }
    static __formid = 0
    _buildForm() {
        let form = document.createElement('div')
        this.form = form

        let fabric = (name, mx) => {
            let label = document.createElement('label')
            label.innerText = name

            let inp = document.createElement('input')
            inp.setAttribute('min', '1')
            inp.setAttribute('max', mx)
            inp.setAttribute('value', '1')
            inp.setAttribute('type', 'number')

            label.append(inp)
            this.form.appendChild(label)

            return inp
        }

        // Tier, LvL
        let rank = this.item.data.rank

        // alternatywa: rank < 4 ? 1 : (rank < 7 ? 2 : (rank < 10 ? 3 : 4))
        this.inpTier = fabric('Tier', 1 + (rank > 3) + (rank > 6) + (rank > 9))
        this.inpLvl = fabric('LvL', 6)

        /// Mod
        let id = 'buildDriffSlotSel' + GUIDriffSlot.__formid++;

        this.inpMod = document.createElement('input')
        this.inpMod.setAttribute('list', id)
        this.inpMod.style.setProperty('width', '40%')

        let lst = document.createElement('datalist')
        lst.setAttribute('id', id)

        for (let driff of Object.values(DriffData.driffs)) {
            if (driff.name == 'Err')
                continue
            let opt = document.createElement('option')
            opt.setAttribute('value', driff.fullname)

            lst.appendChild(opt)
        }

        let labelMod = document.createElement('label')
        labelMod.innerText = 'Mod'

        if (this.driff != null) {
            this.inpLvl.value = this.driff.lvl
            this.inpTier.value = this.driff.tier
            this.inpMod.value = this.driff.data.fullname

            setTimeout(() => this.inpTier.onchange(null), 1)
        }


        labelMod.appendChild(this.inpMod)
        labelMod.appendChild(lst)
        this.form.appendChild(labelMod)
    }

    get() {
        return this.container
    }
}

class GUIItem {
    // rank : cap, slots
    static caps = {
        2: [4, 1],
        3: [4, 1],
        4: [8, 2],
        5: [10, 2],
        6: [12, 2],
        7: [15, 2],
        8: [18, 2],
        9: [21, 2],
        10: [24, 3],
        11: [28, 3],
        12: [32, 3],
    }

    /**
     * 
     * @param {GUIItemData} data 
     */
    constructor(data) {
        let cap = GUIItem.caps[data.rank]

        this.maxPower = cap[0]
        this.data = data
        this.slot = null
        this.driffs = []

        this._buildView()

        for (let i = 0; i < cap[1]; i++) {
            let driff = new GUIDriffSlot(this)
            this.driffs.push(driff)
            this.body.appendChild(driff.get())
        }

        switch (cap[1]) {
            case 1:
                this.driffs[0].container.style.setProperty('left', '30px')
                break
            case 2:
                this.driffs[0].container.style.setProperty('left', '11px')
                this.driffs[1].container.style.setProperty('left', '49px')
                break
            case 3:
                this.driffs[0].container.style.setProperty('left', '0px')
                this.driffs[1].container.style.setProperty('left', '30px')
                this.driffs[2].container.style.setProperty('left', '60px')
                break
        }


        this.container.onclick = ev => GUIConf.edit(this)
    }
    _buildView() {
        this.container = document.createElement('div')

        this.head = document.createElement('div')
        this.body = document.createElement('div')

        this.container.appendChild(this.head)
        this.container.appendChild(this.body)

        this.setIcon(this.data.getImgSrc())
    }

    /**
     * zwraca zajętą pojemność
     * @returns {number}
     */
    calcPower() {
        let pow = 0

        for (let driff of this.driffs)
            if (driff.driff != null)
                pow += driff.driff.power()

        return pow
    }

    /**
     * zwraca true jeśli suma poweru driffów przekracza pojemność itemu
     * @returns {Boolean}
     */
    overPower() {
        return this.calcPower() > this.maxPower
    }

    /**
     * 
     * @returns {HTMLSpanElement }
     */
    get() {
        return this.container
    }

    /**
     * 
     * @param {String} src 
     */
    setIcon(src) {
        this.head.innerHTML = ''

        let img = document.createElement('div')
        img.setAttribute('class', 'GUIItemImg')

        img.style.setProperty('background-image', `url('${src}')`)

        let span = document.createElement('span')
        span.setAttribute('class', 'buildItemImgName')
        span.innerText = this.data.fullname

        img.appendChild(span)
        this.head.appendChild(img)
    }

    /**
     * Odświeża wygląd slotów driffów
     */
    refreshGUIDriffs() {
        for (let driff of this.driffs)
            driff.refreshGUI()
    }
}
class GUIItemData {
    static items = {}
    static __id = 0


    /**
     * 
     * @param {String} name 
     * @param {String} fullname 
     * @param {number} rank 
     * @param {String} type 
     */
    constructor(name, fullname, rank, type, epik = false) {
        this.id = GUIItemData.__id++;
        this.fullname = fullname
        this.name = name
        this.rank = rank
        this.type = type
        this.epik = epik


        if (!(type in GUIItemData.items))
            GUIItemData.items[type] = []

        GUIItemData.items[type].push(this)

    }

    /**
     * 
     * @returns {String} src pliku .png
     */
    getImgSrc() {
        return `icons/eq/${this.type}/${this.name}.png`
    }

    /**
     * 
     * @param {String} type
     * @param {String} name
     * @returns {GUIItemData}
     */
    static getData(type, name) {
        for (let data of GUIItemData.items[type])
            if (data.name == name)
                return data
        return null
    }

    /**
     * 
     * @param {Number} id 
     * @returns {GUIItemData}
     */
    static fromId(id) {
        for (let type in GUIItemData.items)
            for (let data of GUIItemData.items[type])
                if (data.id == id)
                    return data
        return null
    }
}



/// data
function initData() {
    new DriffData('band', 'Szansa na trafienie krytyczne', .5, 4, 60, 'Obrazen')
    new DriffData('teld', 'Szansa na podwójny atak', .5, 4, 60, 'Obrazen')
    new DriffData('alorn', 'Redukcja obrażeń', .5, 4, NaN, 'Redukcji')
    new DriffData('farid', 'Szansa na unik', .5, 4, 60, 'Redukcji')
    new DriffData('Err', 'Wyssanie many', .5, 1, NaN, 'Specjalny') // z kolorem zgaduje

    new DriffData('unn', 'Dodatkowe obrażenia od ognia', .5, 3, 60, 'Obrazen')
    new DriffData('kalh', 'Dodatkowe obrażenia od zimna', .5, 3, 60, 'Obrazen')
    new DriffData('val', 'Dodatkowe obrażenia od energii', .5, 3, 60, 'Obrazen')
    new DriffData('abaf', 'Modyfikator obrażeń magicznych', .5, 3, null, 'Obrazen')
    new DriffData('astah', 'Modyfikator obrażeń fizycznych', .5, 3, null, 'Obrazen')
    new DriffData('ulk', 'Modyfikator trafień wręcz', 1, 3, null, 'Celnosci')
    new DriffData('ling', 'Modyfikator trafień dystansowych', 1, 3, null, 'Celnosci')
    new DriffData('oda', 'Modyfikator trafień mentalnych', 1, 3, null, 'Celnosci')
    new DriffData('holm', 'Szansa na zredukowanie obrażeń', .5, 3, 60, 'Redukcji')
    new DriffData('verd', 'Szansa na odczarowanie', .5, 3, 60, 'Specjalny')
    new DriffData('faln', 'Redukcja obrażeń krytycznych', 2, 3, 60, 'Redukcji')
    new DriffData('iori', 'Redukcja otrzymanych obrażeń biernych', 1, 3, 80, 'Redukcji')

    new DriffData('von', 'Zużycie many', 1, 2, 60, 'Specjalny')
    new DriffData('amad', 'Zużycie kondycji', 1, 2, 60, 'Specjalny')
    new DriffData('ann', 'Regeneracja many', .15, 2, 80, 'Specjalny')
    new DriffData('eras', 'Regeneracja kondycjii', .15, 2, 80, 'Specjalny')
    new DriffData('dur', 'Podwójne losowanie trafienia', 1, 2, 60, 'Celnosci')
    new DriffData('elen', 'Podwójne losowanie obrony', 1, 2, NaN, 'Obrony')
    new DriffData('lorb', 'Przełamanie odporności na urok', 1, 2, 60, 'Celnosci')
    new DriffData('grod', 'Odporność na trafienie krytyczne', .5, 2, 60, 'Obrony')

    new DriffData('tall', 'Obrona wręcz', 1, 1, null, 'Obrony')
    new DriffData('tovi', 'Obrona dystansowa', 1, 1, null, 'Obrony')
    new DriffData('grud', 'Obrona przeciw urokom', 1, 1, null, 'Obrony')
    new DriffData('adrim', 'Odporność na Zamrożenie', 1, 1, 80, 'Specjalny')
    new DriffData('heb', 'Odporność na Unieruchomienie', .5, 1, NaN, 'Specjalny')



    new GUIItemData('maiarot', 'Maiarot', 2, 'Amulety');
    new GUIItemData('derengil', 'Derengil', 2, 'Bron');
    new GUIItemData('sturprang', 'Sturprang', 2, 'Bron');
    new GUIItemData('ayol', 'Ayol', 2, 'Bron');
    new GUIItemData('czengsvesy', 'Czengsvesy', 2, 'Buty');
    new GUIItemData('martumal', 'Martumal', 2, 'Helmy');
    new GUIItemData('arcanscape', 'Arcanscape', 2, 'Pierki');

    new GUIItemData('markahn', 'Markahn', 3, 'Amulety');
    new GUIItemData('sphaera', 'Sphaera', 3, 'Amulety');
    new GUIItemData('ostolbin', 'Ostolbin', 3, 'Amulety');
    new GUIItemData('obroza_wladcy', 'Obroża Władcy', 3, 'Amulety');
    new GUIItemData('rolrak', 'Rolrak', 3, 'Bron');
    new GUIItemData('tasak', 'Tasak', 3, 'Bron');
    new GUIItemData('geomorph_core', 'Geomorph Core', 3, 'Bron');
    new GUIItemData('davgretor', 'Davgretor', 3, 'Bron');
    new GUIItemData('piroklast', 'Piroklast', 3, 'Bron');
    new GUIItemData('isverd', 'Isverd', 3, 'Bron');
    new GUIItemData('tezec', 'Tężec', 3, 'Bron');
    new GUIItemData('sidun', 'Sidun', 3, 'Bron');
    new GUIItemData('irkamale', 'Irkamale', 3, 'Bron');
    new GUIItemData('lysmary', 'Lysmary', 3, 'Buty');
    new GUIItemData('jeroszki', 'Jeroszki', 3, 'Buty');
    new GUIItemData('moczary', 'Moczary', 3, 'Buty');
    new GUIItemData('grzebien', 'Grzebień', 3, 'Helmy');
    new GUIItemData('ishelm', 'Ishelm', 3, 'Helmy');
    new GUIItemData('khalam', 'Khalam', 3, 'Helmy');
    new GUIItemData('anabolik', 'Anabolik', 3, 'Paski');
    new GUIItemData('radius_electricum', 'Radius Electricum', 3, 'Paski');
    new GUIItemData('promuris', 'Promuris', 3, 'Paski');
    new GUIItemData('koriatula', 'Koriatula', 3, 'Paski');
    new GUIItemData('fiskorl', 'Fiskorl', 3, 'Pierki');
    new GUIItemData('basileus', 'Basileus', 3, 'Pierki');
    new GUIItemData('uguns', 'Uguns', 3, 'Pierki');
    new GUIItemData('fulgur', 'Fulgur', 3, 'Pierki');
    new GUIItemData('karlder', 'Karlder', 3, 'Pierki');
    new GUIItemData('brassary', 'Brassary', 3, 'Rekawice');
    new GUIItemData('gest_wladcy', 'Gest Władcy', 3, 'Rekawice');
    new GUIItemData('fraxy', 'Fraxy', 3, 'Rekawice');
    new GUIItemData('isthrimm', 'Isthrimm', 3, 'Tarcze Karwasze');
    new GUIItemData('bartaur', 'Bartaur', 3, 'Zbroje');
    new GUIItemData('brunnle', 'Brunnle', 3, 'Zbroje');

    new GUIItemData('caratris', 'Caratris', 4, 'Amulety');
    new GUIItemData('smoczy_gnat', 'Smoczy Gnat', 4, 'Bron');
    new GUIItemData('navigon', 'Navigon', 4, 'Pierki');
    new GUIItemData('nit', 'Nit', 4, 'Pierki');
    new GUIItemData('smocze_skrzydlo', 'Smocze Skrzydło', 4, 'Tarcze Karwasze');

    new GUIItemData('valazan', 'Valazan', 5, 'Amulety');
    new GUIItemData('danthum', 'Danthum', 5, 'Amulety');
    new GUIItemData('ognisty_mlot', 'Ognisty Młot', 5, 'Bron');
    new GUIItemData('tangnary', 'Tangnary', 5, 'Buty');
    new GUIItemData('gathril', 'Gathril', 5, 'Helmy');
    new GUIItemData('czacha', 'Czacha', 5, 'Helmy');
    new GUIItemData('sentrion', 'Sentrion', 5, 'Paski');
    new GUIItemData('bryza', 'Bryza', 5, 'Peleryny');
    new GUIItemData('nurthil', 'Nurthil', 5, 'Peleryny');
    new GUIItemData('xenothor', 'Xenothor', 5, 'Peleryny');
    new GUIItemData('balast', 'Balast', 5, 'Pierki');
    new GUIItemData('vaekany', 'Vaekany', 5, 'Rekawice');
    new GUIItemData('tirhel', 'Tirhel', 5, 'Spodnie');
    new GUIItemData('wzorek', 'Wzorek', 5, 'Spodnie');
    new GUIItemData('obdartusy', 'Obdartusy', 5, 'Spodnie');
    new GUIItemData('berglisy', 'Berglisy', 5, 'Tarcze Karwasze');
    new GUIItemData('geury', 'Geury', 5, 'Tarcze Karwasze');
    new GUIItemData('pancerz_komandorski', 'Pancerz Komandorski', 5, 'Zbroje');
    new GUIItemData('virthil', 'Virthil', 5, 'Zbroje');
    new GUIItemData('diabolo', 'Diabolo', 5, 'Zbroje');
    new GUIItemData('opoka_bogow', 'Opoka Bogów', 5, 'Zbroje');

    new GUIItemData('zemsta_ivravula', 'Zemsta Ivravula', 6, 'Amulety');
    new GUIItemData('virral', 'Virral', 6, 'Bron');
    new GUIItemData('urntsul', 'Urntsul', 6, 'Bron');
    new GUIItemData('buoriany', 'Buoriany', 6, 'Bron');
    new GUIItemData('lawina', 'Lawina', 6, 'Bron');
    new GUIItemData('thorimmy', 'Thorimmy', 6, 'Buty');
    new GUIItemData('ghaitarog', 'Ghaitarog', 6, 'Helmy');
    new GUIItemData('dagorilm', 'Dagorilm', 6, 'Paski');
    new GUIItemData('debba', 'Debba', 6, 'Peleryny');
    new GUIItemData('biltabandury', 'Biltabandury', 6, 'Rekawice');

    new GUIItemData('vogurun', 'Vogurun', 7, 'Amulety');
    new GUIItemData('yurugu', 'Yurugu', 7, 'Amulety');
    new GUIItemData('istav', 'Istav', 7, 'Bron');
    new GUIItemData('wladca_losu', 'Władca Losu', 7, 'Bron');
    new GUIItemData('fanga', 'Fanga', 7, 'Bron');
    new GUIItemData('otwieracz', 'Otwieracz', 7, 'Bron');
    new GUIItemData('gjolmar', 'Gjolmar', 7, 'Bron');
    new GUIItemData('batagur', 'Batagur', 7, 'Bron');
    new GUIItemData('virveny', 'Virveny', 7, 'Buty');
    new GUIItemData('sigil', 'Sigil', 7, 'Helmy');
    new GUIItemData('powrot_ivravula', 'Powrót Ivravula', 7, 'Peleryny');
    new GUIItemData('dracorporis', 'Dracorporis', 7, 'Peleryny');
    new GUIItemData('griv', 'Griv', 7, 'Pierki');
    new GUIItemData('zadry', 'Zadry', 7, 'Rekawice');
    new GUIItemData('varrvy', 'Varrvy', 7, 'Spodnie');
    new GUIItemData('nadzieja_pokolen', 'Nadzieja Pokoleń', 7, 'Zbroje');
    new GUIItemData('harttraum', 'Harttraum', 7, 'Zbroje');

    new GUIItemData('aqueniry', 'Aqueniry', 8, 'Buty');
    new GUIItemData('pysk', 'Pysk', 8, 'Helmy');
    new GUIItemData('exuvium', 'Exuvium', 8, 'Paski');
    new GUIItemData('nurt', 'Nurt', 8, 'Paski');
    new GUIItemData('tsunami', 'Tsunami', 8, 'Peleryny');
    new GUIItemData('skogan', 'Skogan', 8, 'Pierki');
    new GUIItemData('mauremys', 'Mauremys', 8, 'Pierki');
    new GUIItemData('pazury', 'Pazury', 8, 'Rekawice');
    new GUIItemData('skiilfy', 'Skiilfy', 8, 'Spodnie');
    new GUIItemData('aquariusy', 'Aquariusy', 8, 'Spodnie');
    new GUIItemData('karapaks', 'Karapaks', 8, 'Tarcze Karwasze');
    new GUIItemData('dmorlung', 'Dmorlung', 8, 'Zbroje');
    new GUIItemData('vorleah', 'Vorleah', 8, 'Zbroje');

    new GUIItemData('htagan', 'Htagan', 9, 'Helmy');
    new GUIItemData('angwallion', 'Angwallion', 9, 'Peleryny');

    new GUIItemData('serce_seleny', 'Serce Seleny', 10, 'Amulety');
    new GUIItemData('mallus_selenorum', 'Mallus Selenorum', 10, 'Bron');
    new GUIItemData('szpony', 'Szpony', 10, 'Bron');
    new GUIItemData('taehal', 'Taehal', 10, 'Bron');
    new GUIItemData('bol', 'Ból', 10, 'Bron');
    new GUIItemData('ciern', 'Cierń', 10, 'Bron');
    new GUIItemData('trojzab_admiralski', 'Trójząb Admiralski', 10, 'Bron');
    new GUIItemData('alendry', 'Alendry', 10, 'Buty');
    new GUIItemData('cierpietniki', 'Cierpiętniki', 10, 'Buty');
    new GUIItemData('envile', 'Envile', 10, 'Buty');
    new GUIItemData('pamiec_morany', 'Pamięć Morany', 10, 'Helmy');
    new GUIItemData('milosc_morany', 'Miłość Morany', 10, 'Helmy');
    new GUIItemData('groza_seleny', 'Groza Seleny', 10, 'Paski');
    new GUIItemData('nienawisc_draugula', 'Nienawiść Draugula', 10, 'Paski');
    new GUIItemData('objecia_morany', 'Objęcia Morany', 10, 'Paski');
    new GUIItemData('hanba_seleny', 'Hańba Seleny', 10, 'Peleryny');
    new GUIItemData('admiralski_gronostaj', 'Admiralski Gronostaj', 10, 'Peleryny');
    new GUIItemData('zaglada_ludow', 'Zagłada Ludów', 10, 'Pierki');
    new GUIItemData('przysiega_draugula', 'Przysięga Draugula', 10, 'Pierki');
    new GUIItemData('szpony_seimhi', 'Szpony Seimhi', 10, 'Rekawice');
    new GUIItemData('aeterus_passio', 'Aeterus Passio', 10, 'Rekawice');
    new GUIItemData('erbaile', 'Erbaile', 10, 'Spodnie');
    new GUIItemData('udreki', 'Udręki', 10, 'Spodnie');
    new GUIItemData('kil', 'Kil', 10, 'Tarcze Karwasze');
    new GUIItemData('undurisy', 'Undurisy', 10, 'Tarcze Karwasze');
    new GUIItemData('ariarchy', 'Ariarchy', 10, 'Tarcze Karwasze');
    new GUIItemData('takerony', 'Takerony', 10, 'Tarcze Karwasze');
    new GUIItemData('inavoxy', 'Inavoxy', 10, 'Tarcze Karwasze');

    new GUIItemData('ortasis', 'Ortasis', 11, 'Amulety');
    new GUIItemData('dorbis', 'Dorbis', 11, 'Amulety');
    new GUIItemData('arhauty', 'Arhauty', 11, 'Buty');
    new GUIItemData('cien_tarula', 'Cień Tarula', 11, 'Peleryny');
    new GUIItemData('temary', 'Temary', 11, 'Spodnie');
    new GUIItemData('ziraki', 'Ziraki', 11, 'Spodnie');

    new GUIItemData('salmurn', 'Salmurn', 12, 'Zbroje');
    new GUIItemData('zalla', 'Zalla', 12, 'Zbroje');
    new GUIItemData('dar_skrzydlatej', 'Dar Skrzydlatej', 12, 'Pierki');
    new GUIItemData('remigesy', 'Remigesy ', 12, 'Rekawice');
    new GUIItemData('wyrok_hellara', 'Wyrok Hellara', 12, 'Paski');
    new GUIItemData('vengur', 'Vengur', 12, 'Peleryny');
    new GUIItemData('voglery', 'Voglery ', 12, 'Rekawice');

    new GUIItemData('allenor', 'Allenor', 9, 'Bron', true);
    new GUIItemData('attawa', 'Attawa', 9, 'Bron', true);
    new GUIItemData('gorthdar', 'Gorthdar', 9, 'Bron', true);
    new GUIItemData('imisindo', 'Imisindo', 9, 'Bron', true);
    new GUIItemData('latarnia_zycia', 'Latarnia Życia', 9, 'Bron', true);
    new GUIItemData('washi', 'Washi', 9, 'Bron', true);
    new GUIItemData('zmij', 'Żmij', 9, 'Bron', true);
}



initData()
GUI.init()