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


        let w = '0'

        for (let slot of GUI.eqSlots)
            w += saveSlot(slot)
        w += Build.NumToLet(GUI.invSlots.length, 2)
        for (let slot of GUI.invSlots)
            w += saveSlot(slot)
        w += Build.NumToLet(GUI.invDriffSlots.length)
        for (let driff of GUI.invDriffSlots)
            w += saveDriff(driff.driff)

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
        if (str.indexOf('?') != -1)
            str = str.slice(str.indexOf('?') + 1)

        try {
            if (str[0] == 'e') {
                Build.loadOld(str)
                return true
            }
        } catch {}


        let onlyItems = str[0] != '0'

        if (!onlyItems)
            str = str.slice(1)

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
        if (onlyItems) {
            while (x < str.length)
                GUI.addInvSlot(loadSlot())
            for (let i = 0; i < 128; i++)
                GUI.addInvDriffSlot(new GUIInvDriffSlot())
        } else {
            let mx = get2()
            for (let i = 0; i < mx; i++)
                GUI.addInvSlot(loadSlot())
            mx = get2()
            for (let i = 0; i < mx; i++) {
                let slot = new GUIInvDriffSlot()
                slot.insert(loadDriff(null))
                GUI.addInvDriffSlot(slot)
            }
        }

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
        for (let i = 0; i < 128; i++)
            GUI.addInvDriffSlot(new GUIInvDriffSlot())

        Build.calculate()

        return true
    }

    static clearGUI() {
        for (let slot of GUI.invSlots)
            slot.insertItem(null)
        for (let slot of GUI.eqSlots)
            slot.insertItem(null)
        for (let slot of GUI.invDriffSlots)
            slot.insert(null)
        GUIConf.edit(null)

        Build.calculate()

        GUI.invDriffSlots.splice(0, GUI.invDriffSlots.length)
        GUI.invSlots.splice(0, GUI.invSlots.length)
        GUI.eqSlots.splice(0, GUI.eqSlots.length)

        GUI.invDriffs.innerHTML = ''
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

        if (GUIConf.editDriff != null && GUIConf.editDriff.driff === this)
            GUIConf.editDriff.refreshGUI()
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
        this.refreshGUI()
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
        if (this.slot != null && this.slot.item.slot != null && this.slot.item.slot.isEq())
            Build.calculate()
    }

    power() {
        return this.data.pow * this.tier
    }
    effekt() {
        let x = this.tier + this.lvl - 1
        if (this.lvl >= 19)
            x += this.lvl - 18

        if (this.slot != null)
            x *= this.slot.item.data.epik ? 1.6 : 1

        return this.data.amp * x
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
    static invDriffs = document.getElementById('buildinvDriffs')
    static select = document.getElementById('buildItemSlectDiv')
    static info = document.getElementById('buildinfo')
    static conf = document.getElementById('buildconf')
    static foot = document.getElementById('buildfoot')

    static eqSlots = []
    static invSlots = []
    static invDriffSlots = []
    static invDriffsSlots = []

    static init() {
        // Sloty
        for (let type of Array.of('Bron', 'Tarcze Karwasze', 'Peleryny', 'Helmy', 'Rekawice', 'Zbroje', 'Paski', 'Spodnie', 'Amulety', 'Buty', 'Pierki', 'Pierki'))
            this.addEqSlot(new GUISlot(type))

        for (let i = 0; i < 32; i++)
            GUI.addInvSlot(new GUISlot(null))
        for (let i = 0; i < 128; i++)
            GUI.addInvDriffSlot(new GUIInvDriffSlot())

        // Conf
        GUIConf.init()

        GUI._makeEpiks()


        if (window.location.search != '')
            Build.load(window.location.search.slice(1))
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
     * @param {GUIInvDriffSlot} slot
     */
    static addInvDriffSlot(slot) {
        GUI.invDriffSlots.push(slot)
        GUI.invDriffs.appendChild(slot.get())
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
     * 
     * @param {Driff} driff 
     */
    static addToInvDriff(driff) {
        for (let slot of GUI.invDriffSlots) {
            if (slot.driff == null) {
                slot.insert(driff)
                return
            }
        }

        let slot = new GUIInvDriffSlot()
        GUI.addInvDriffSlot(slot)
        slot.insert(driff)
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
        /** @type {GUIInvDriffSlot} */
    static editDriff = null
    static divs = {
        save: {
            main: document.getElementById('buildSaveLoad'),

            save: document.getElementById('buildSave'),
            load: document.getElementById('buildLoad'),
        },

        nav: {
            make: document.getElementById('buildConfNavMake'),
            save: document.getElementById('buildConfNavSave'),

            invItems: document.getElementById('buildInvNavBItemy'),
            invDriffs: document.getElementById('buildInvNavBDriffy'),
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

            data = window.location.origin + window.location.pathname + '?' + data

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

            GUIConf.divs.save.main.style.setProperty('display', 'block')
        }

        GUIConf.divs.nav.invItems.onclick = () => {
            GUI.inv.style.setProperty('display', 'block')
            GUI.select.style.setProperty('display', 'none')
            GUI.invDriffs.style.setProperty('display', 'none')
        }
        GUIConf.divs.nav.invDriffs.onclick = () => {
            GUI.inv.style.setProperty('display', 'none')
            GUI.select.style.setProperty('display', 'none')
            GUI.invDriffs.style.setProperty('display', 'block')
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
        GUI.invDriffs.style.setProperty('display', 'none')
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
        if (GUIConf.editDriff != null)
            GUIConf.editdriff(null)

        if (GUIConf.editItem != null)
            GUIConf.editItem.slot.setActive(false)

        GUIConf.editItem = item
        if (item != null) {
            item.slot.setActive(true)

            GUIConf.divs.edit.driffs.innerHTML = ''
            for (let driff of item.driffs)
                GUIConf.divs.edit.driffs.appendChild(driff.getForm())
        }

        GUIConf.setInfo()
    }

    /**
     * 
     * @param {GUIDriffSlot} driff 
     */
    static editdriff(driff) {
        if (GUIConf.editItem != null)
            GUIConf.edit(null)

        if (GUIConf.editDriff != null)
            GUIConf.editDriff.setActive(false)

        GUIConf.divs.edit.driffs.innerHTML = ''
        this.editDriff = driff
        if (driff != null) {
            driff.setActive(true)
            GUIConf.divs.edit.driffs.appendChild(driff.getForm())
        }



        GUIConf.setInfo()
    }

    /**
     * uzupełnia div#buildEditInfo
     */
    static setInfo() {
        let html = ''

        GUIConf.divs.edit.main.style.setProperty('display', 'block')
        this.divs.save.main.style.setProperty('display', 'none')

        let color = (color, text) => `<span style='color: ${color}'>${text}</span>`
        if (GUIConf.editItem != null) {

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
            html += '<div style="display: none;">'
            for (let i of data.getStatsUp())
                html += `<h4>${GUIItemData.statName(i)}: ${GUIConf.editItem.getStat(i)}</h4>`
            html += '</br>'
            for (let i of data.getStats())
                html += `<h4>${GUIItemData.statName(i)}: ${GUIConf.editItem.getStat(i)}</h4>`
            html += '</div>'

        } else if (GUIConf.editDriff != null) {
            let driff = GUIConf.editDriff.driff
            let data = GUIConf.editDriff.driff.data

            let img = `<span style="position: relative; with: 26px; height: 26px;">${GUIConf.editDriff.driff.getGUI().innerHTML}</span>`

            let text = `${['Subdrif', 'Bidrif', 'Magnidrif', 'ArcyDrif'][driff.tier - 1]} ${data.name}`
            text = color('lightblue', text)

            html = `
                <h2>
                ${img}
                <span style="margin-left: 30px; margin-right: 4px;">${text}</span>
                ${img}
                    <div>${data.fullname} ${driff.effekt()}%</div>
                </h2>
                <h3>Potęga: ${driff.power()}</h3>
                `
        } else
            GUIConf.divs.edit.main.style.setProperty('display', 'none')

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
        this.inpEx = null

        this.refreshGUI()

        this.container.onclick = () => {
            if (GUIConf.editDriff == null) return
            if (this.driff != null) return

            let driff = GUIConf.editDriff.driff

            for (let slot of this.item.driffs) {
                if (slot.driff != null && slot.driff.data === driff.data) {
                    Info.showMessage('Ten mod już jest w tym itemie')
                    return
                }
            }

            this.setDriff(driff)
            if (this.item.overPower()) {
                this.setDriff(null)
                GUIConf.editDriff.insert(driff)
                Info.showMessage('Przekroczona pojemność')
            } else {
                GUIConf.editDriff.insert(null)
                GUIConf.editdriff(null)
            }
        }
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

    setDriff(driff, silent = false) {
        this.driff = driff
        this.refreshGUI()

        if (!silent && this.form != null) {
            this.inpLvl.value = driff == null ? 1 : driff.lvl
            this.inpTier.value = driff == null ? 1 : driff.tier
            this.inpMod.value = driff == null ? '' : driff.data.fullname

            this.inpTier.onchange()
            this.inpLvl.onchange()
            this.inpMod.onchange()
        }

        if (!silent && this.item.slot != null && this.item.slot.isEq())
            Build.calculate()
    }

    getForm() {
        if (this.form != null)
            return this.form

        this._buildForm()

        // Functional
        this.inpTier.onchange = () => {
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
        this.inpLvl.onchange = () => {
            let val = parseInt(this.inpLvl.value)
            if (1 > val || val > this.inpLvl.getAttribute('max')) {
                this.inpLvl.value = '1'
                val = 1
            }

            if (this.driff != null)
                this.driff.setLvl(val)

            GUIConf.setInfo()
        }
        this.inpMod.onchange = () => {
            let data = DriffData.driffs[this.inpMod.value]
            if (!data) {
                if (this.driff != null)
                    this.setDriff(null, true)
            } else {
                let undo = false
                for (let driffSlot of this.item.driffs) {
                    if (driffSlot !== this)
                        if (undo = (undo || (driffSlot.driff != null && driffSlot.driff.data === data)))
                            break
                }
                let undoDriff = this.driff
                this.setDriff(new Driff(data, this, this.inpLvl.value, this.inpTier.value), true)

                if (!undo)
                    undo = this.item.overPower()

                if (undo) {
                    this.inpMod.value = undoDriff == null ? '' : undoDriff.data.fullname
                    this.setDriff(undoDriff, true)
                }
            }

            if (this.item.slot.isEq())
                Build.calculate()

            this.refreshGUI()

            GUIConf.setInfo()
        }
        this.inpEx.onclick = () => {
            if (this.driff == null)
                return

            GUI.addToInvDriff(this.driff)
            this.setDriff(null)

            this.inpMod.value = ''
            this.inpMod.onchange()
            this.inpLvl.value = '1'
            this.inpLvl.onchange()
            this.inpTier.value = '1'
            this.inpTier.onchange()
        }

        if (this.item.data.epik) {
            this.inpTier.disabled = true
            this.inpMod.disabled = true
            this.inpEx.disabled = true
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

        /// Extract
        this.inpEx = document.createElement('button')
        this.inpEx.innerText = 'Wyjmij'


        labelMod.appendChild(this.inpMod)
        labelMod.appendChild(lst)
        this.form.appendChild(labelMod)

        this.form.appendChild(this.inpEx)
    }

    get() {
        return this.container
    }
}
class GUIInvDriffSlot {
    constructor() {
        /** @type {Driff} */
        this.driff = null

        this.container = document.createElement('div')
        this.container.setAttribute('class', 'invGUIDriffSlot')

        this.divText = document.createElement('div')
        this.divDriff = document.createElement('div')
        this.divPower = document.createElement('div')
        this.divEffect = document.createElement('div')

        for (let div of Array.of(this.divText, this.divDriff, this.divPower, this.divEffect))
            this.container.appendChild(div)

        this.setActive(false)


        this.container.onclick = () => {
            if (this.driff != null)
                GUIConf.editdriff(this)
            else if (GUIConf.editDriff != null) {
                this.insert(GUIConf.editDriff.driff)
                GUIConf.editDriff.insert(null)
                GUIConf.editdriff(this)
            }
        }
    }

    /**
     * 
     * @param {Driff} driff 
     */
    insert(driff) {
        this.driff = driff

        this.divDriff.innerHTML = ''
        if (driff == null) {
            this.divText.innerHTML = ''
            this.divPower.innerHTML = ''
            this.divEffect.innerHTML = ''
        } else {
            this.divText.innerText = driff.data.name
            this.divDriff.appendChild(driff.getGUI())
            this.divPower.innerText = driff.power()
            this.divEffect.innerText = (Math.round(driff.effekt() * 10) / 10) + '%'
        }
    }

    /**
     * 
     * @returns {HTMLDivElement}
     */
    getForm() {
        let container = document.createElement('div')

        let fabric = (name, txt, up, down) => {
            let div = document.createElement('div')
            let span

            span = document.createElement('span')
            span.style.setProperty('display', 'inline-block')
            span.innerText = name + ' '
            div.appendChild(span)

            let textspan = document.createElement('span')
            textspan.style.setProperty('display', 'inline-block')
            textspan.style.setProperty('margin-left', '5px')
            textspan.innerText = txt
            div.appendChild(textspan)

            let bUp = document.createElement('div')
            bUp.setAttribute('class', 'formbUp')
            let bDown = document.createElement('div')
            bDown.setAttribute('class', 'formbDown')

            span = document.createElement('span')
            span.style.setProperty('display', 'inline-block')
            div.appendChild(span)

            span.appendChild(bUp)
            span.appendChild(bDown)


            bUp.onclick = () => {
                if (up()) return

                this.driff['set' + name[0].toUpperCase() + name.slice(1)](this.driff[name] + 1)

                textspan.innerText = this.driff[name]
            }
            bDown.onclick = () => {
                if (down()) return

                this.driff['set' + name[0].toUpperCase() + name.slice(1)](this.driff[name] - 1)

                textspan.innerText = this.driff[name]
            }

            return div
        }



        container.appendChild(fabric('tier', this.driff.tier,
            () => this.driff.tier >= 4,
            () => this.driff.tier <= 1 || (this.driff.lvl > [6, 11, 16][this.driff.tier - 2])))
        container.appendChild(fabric('lvl', this.driff.lvl,
            () => this.driff.lvl >= [6, 11, 16, 21][this.driff.tier - 1],
            () => this.driff.lvl <= 1))

        return container
    }

    refreshGUI() {
        this.insert(this.driff)
        if (this === GUIConf.editDriff)
            GUIConf.setInfo()
    }

    /**
     * 
     * @returns {HTMLDivElement}
     */
    get() {
        return this.container
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

    getStat(stat) {
        return this.data.getStat(stat)
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
    constructor(name, fullname, rank, type, stats, epik = false) {
        this.id = GUIItemData.__id++;
        this.fullname = fullname
        this.name = name
        this.rank = rank
        this.type = type
        this.epik = epik
        this._stats = stats


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
     * @param {String} stat
     * @returns {String | Number | null} 
     */
    getStat(stat) {
        let w = this._stats[stat]
        return w === undefined ? null : w
    }


    static _statsNames = {
        waga: 'waga',
        wartosc: 'wartość',
        pz: 'pż',
        konda: 'kondycja',
        mana: 'mana',
        moc: 'moc',
        sila: 'siła',
        wiedza: 'wiedza',
        zreka: 'zręczność',
        obr: 'obrażenia',
        r_obr: 'rodzaj_obrażeń',
        res_ene: 'odporność_energia',
        res_ogien: 'odporność_ogień',
        res_zimno: 'odporność_zimno',
        res_uro: 'odporność_uroki',
        res_klut: 'pancerz_kłute',
        res_obuch: 'pancerz_obuchowe',
        res_siek: 'pancerz_sieczne',
        wym_klasa: 'wymagana_klasa',
        wym_lvl: 'wymagany_poziom',
        wym_moc: 'wymagana_moc',
        wym_sila: 'wymagana_siła',
        wym_wiedza: 'wymagana_wiedza',
        wym_zreka: 'wymagana_zręczność',
    }

    getStats() {
        return this._getStats(['obr', 'r_obr', 'moc', 'wiedza', 'sila', 'zreka', 'pz', 'mana', 'konda', 'res_ene', 'res_ogien', 'res_zimno', 'res_uro', 'res_siek', 'res_obuch', 'res_klut'])
    }
    getStatsUp() {
        return this._getStats(['wartosc', 'waga', 'wym_lvl', 'wym_klasa', 'wym_moc', 'wym_wiedza', 'wym_sila', 'wym_zreka'])
    }
    _getStats(lst) {
        let w = []

        for (let i of lst)
            if (this.getStat(i) !== null)
                w.push(i)

        return w
    }

    /**
     * 
     * @param {String} stat 
     * @returns {String}
     */
    static statName(stat) {
        return GUIItemData._statsNames[stat]
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
    new DriffData('dur', 'Podwójne losowanie trafienia', .5, 2, 60, 'Celnosci')
    new DriffData('elen', 'Podwójne losowanie obrony', 1, 2, NaN, 'Obrony')
    new DriffData('lorb', 'Przełamanie odporności na urok', 1, 2, 60, 'Celnosci')
    new DriffData('grod', 'Odporność na trafienie krytyczne', .5, 2, 60, 'Obrony')

    new DriffData('tall', 'Obrona wręcz', 1, 1, null, 'Obrony')
    new DriffData('tovi', 'Obrona dystansowa', 1, 1, null, 'Obrony')
    new DriffData('grud', 'Obrona przeciw urokom', 1, 1, null, 'Obrony')
    new DriffData('adrim', 'Odporność na Zamrożenie', 1, 1, 80, 'Specjalny')
    new DriffData('heb', 'Odporność na Unieruchomienie', .5, 1, NaN, 'Specjalny')


    new GUIItemData('maiarot', 'Maiarot', 2, 'Amulety', { waga: 3, wartosc: 36000, pz: 120, res_uro: 20, wym_lvl: 18 })
    new GUIItemData('derengil', 'Derengil', 2, 'Bron', { waga: 2, wartosc: 36000, konda: 40, sila: 8, zreka: 6, obr: 66, r_obr: 'sieczne', wym_lvl: 18, wym_sila: 20 })
    new GUIItemData('sturprang', 'Sturprang', 2, 'Bron', { waga: 2, wartosc: 36000, mana: 40, moc: 8, wiedza: 6, obr: 71, r_obr: 'obuchowe', wym_lvl: 18, wym_moc: 20 })
    new GUIItemData('ayol', 'Ayol', 2, 'Bron', { waga: 15, wartosc: 40000, konda: 60, sila: 5, zreka: 9, obr: 74, r_obr: 'kłute', wym_lvl: 20, wym_zreka: 20 })
    new GUIItemData('czengsvesy', 'Czengsvesy', 2, 'Buty', { waga: 8, wartosc: 72000, mana: 30, moc: 7, wiedza: 10, res_klut: 25, res_obuch: 22, res_siek: 23, wym_lvl: 24, wym_wiedza: 25 })
    new GUIItemData('martumal', 'Martumal', 2, 'Helmy', { waga: 15, wartosc: 40000, mana: 40, moc: 6, wiedza: 4, res_uro: 20, res_klut: 21, res_obuch: 20, res_siek: 19, wym_lvl: 20, wym_moc: 20 })
    new GUIItemData('arcanscape', 'Arcanscape', 2, 'Pierki', { waga: 2, wartosc: 40000, pz: 70, konda: 20, mana: 20, res_uro: 30, wym_lvl: 20 })

    new GUIItemData('markahn', 'Markahn', 3, 'Amulety', { waga: 2, wartosc: 136000, pz: 70, konda: 20, mana: 20, wiedza: 3, zreka: 3, res_ogien: 30, res_uro: 30, wym_lvl: 32 })
    new GUIItemData('sphaera', 'Sphaera', 3, 'Amulety', { waga: 2, wartosc: 152000, konda: 80, sila: 8, zreka: 6, res_ene: 40, wym_lvl: 34, wym_sila: 35 })
    new GUIItemData('ostolbin', 'Ostolbin', 3, 'Amulety', { waga: 2, wartosc: 160000, pz: 120, mana: 120, moc: 6, wiedza: 5, wym_lvl: 35, wym_moc: 35 })
    new GUIItemData('obroza_wladcy', 'Obroża Władcy', 3, 'Amulety', { waga: 6, wartosc: 160000, pz: 80, moc: 14, wiedza: 13, wym_lvl: 35, wym_moc: 35 })
    new GUIItemData('rolrak', 'Rolrak', 3, 'Bron', { waga: 5, wartosc: 72000, konda: 40, sila: 6, zreka: 8, obr: 81, r_obr: 'sieczne', res_uro: 20, wym_lvl: 24, wym_zreka: 25 })
    new GUIItemData('tasak', 'Tasak', 3, 'Bron', { waga: 40, wartosc: 56000, pz: 30, konda: 60, sila: 13, obr: 83, r_obr: 'sieczne', wym_lvl: 22, wym_sila: 25 })
    new GUIItemData('geomorph_core', 'Geomorph Core', 3, 'Bron', { waga: 15, wartosc: 136000, mana: 150, moc: 15, wiedza: 2, obr: 95, r_obr: 'obuchowe', wym_lvl: 32, wym_moc: 30 })
    new GUIItemData('davgretor', 'Davgretor', 3, 'Bron', { waga: 35, wartosc: 136000, pz: 100, konda: 50, sila: 15, zreka: 2, obr: 103, r_obr: 'obuchowe', wym_lvl: 32, wym_sila: 30 })
    new GUIItemData('piroklast', 'Piroklast', 3, 'Bron', { waga: 15, wartosc: 152000, pz: 80, konda: 60, sila: 2, zreka: 9, obr: 98, r_obr: 'kłute', res_ogien: 20, res_zimno: 10, wym_lvl: 34, wym_zreka: 35 })
    new GUIItemData('isverd', 'Isverd', 3, 'Bron', { waga: 15, wartosc: 152000, pz: 120, konda: 110, mana: 20, obr: 90, r_obr: 'sieczne', res_ogien: 10, res_zimno: 20, wym_lvl: 34 })
    new GUIItemData('tezec', 'Tężec', 3, 'Bron', { waga: 5, wartosc: 136000, pz: 90, mana: 40, moc: 4, wiedza: 9, obr: 95, r_obr: 'kłute', res_uro: 20, wym_lvl: 32, wym_wiedza: 35 })
    new GUIItemData('sidun', 'Sidun', 3, 'Bron', { waga: 20, wartosc: 152000, pz: 100, konda: 50, sila: 19, obr: 107, r_obr: 'sieczne', wym_lvl: 34, wym_sila: 35 })
    new GUIItemData('irkamale', 'Irkamale', 3, 'Bron', { waga: 6, wartosc: 160000, pz: 120, konda: 80, mana: 40, sila: 4, zreka: 7, obr: 100, r_obr: 'obuchowe', wym_lvl: 35, wym_zreka: 35 })
    new GUIItemData('lysmary', 'Lysmary', 3, 'Buty', { waga: 6, wartosc: 152000, pz: 80, mana: 60, moc: 8, wiedza: 2, res_klut: 29, res_obuch: 27, res_siek: 29, wym_lvl: 34, wym_moc: 35 })
    new GUIItemData('jeroszki', 'Jeroszki', 3, 'Buty', { waga: 15, wartosc: 160000, pz: 100, konda: 100, mana: 20, res_ogien: 20, res_klut: 26, res_obuch: 26, res_siek: 26, wym_lvl: 35 })
    new GUIItemData('moczary', 'Moczary', 3, 'Buty', { waga: 10, wartosc: 120000, pz: 30, sila: 5, zreka: 3, res_klut: 25, res_obuch: 22, res_siek: 23, wym_lvl: 30, wym_sila: 30 })
    new GUIItemData('grzebien', 'Grzebień', 3, 'Helmy', { waga: 15, wartosc: 120000, pz: 20, konda: 40, sila: 8, zreka: 4, res_uro: 20, res_klut: 28, res_obuch: 24, res_siek: 23, wym_lvl: 30, wym_sila: 30 })
    new GUIItemData('ishelm', 'Ishelm', 3, 'Helmy', { waga: 12, wartosc: 152000, pz: 30, konda: 10, sila: 6, zreka: 10, res_klut: 33, res_obuch: 33, res_siek: 29, wym_lvl: 34, wym_zreka: 35 })
    new GUIItemData('khalam', 'Khalam', 3, 'Helmy', { waga: 8, wartosc: 136000, mana: 60, moc: 6, wiedza: 8, res_uro: 20, res_klut: 25, res_obuch: 25, res_siek: 25, wym_lvl: 32, wym_wiedza: 35 })
    new GUIItemData('anabolik', 'Anabolik', 3, 'Paski', { waga: 10, wartosc: 72000, pz: 110, sila: 8, zreka: 5, wym_lvl: 24, wym_sila: 25 })
    new GUIItemData('radius_electricum', 'Radius Electricum', 3, 'Paski', { waga: 1, wartosc: 152000, mana: 70, moc: 9, wiedza: 6, res_ene: 40, wym_lvl: 34, wym_moc: 35 })
    new GUIItemData('promuris', 'Promuris', 3, 'Paski', { waga: 10, wartosc: 160000, pz: 60, sila: 15, zreka: 14, wym_lvl: 35, wym_sila: 35 })
    new GUIItemData('koriatula', 'Koriatula', 3, 'Paski', { waga: 10, wartosc: 160000, pz: 80, konda: 20, mana: 20, moc: 3, wiedza: 5, wym_lvl: 35, wym_wiedza: 35 })
    new GUIItemData('fiskorl', 'Fiskorl', 3, 'Pierki', { waga: 2, wartosc: 104000, sila: 9, zreka: 7, res_uro: 20, res_zimno: 20, wym_lvl: 28, wym_sila: 25 })
    new GUIItemData('basileus', 'Basileus', 3, 'Pierki', { waga: 2, wartosc: 104000, sila: 9, zreka: 7, res_uro: 20, res_zimno: 20, wym_lvl: 28, wym_sila: 25 })
    new GUIItemData('uguns', 'Uguns', 3, 'Pierki', { waga: 2, wartosc: 152000, pz: 140, konda: 40, mana: 40, res_ogien: 20, res_uro: 20, wym_lvl: 34 })
    new GUIItemData('fulgur', 'Fulgur', 3, 'Pierki', { waga: 2, wartosc: 152000, pz: 40, mana: 10, moc: 9, wiedza: 8, res_ene: 20, res_uro: 20, wym_lvl: 34, wym_moc: 35 })
    new GUIItemData('karlder', 'Karlder', 3, 'Pierki', { waga: 2, wartosc: 152000, pz: 40, konda: 10, sila: 9, zreka: 8, res_ene: 20, res_uro: 20, wym_lvl: 34, wym_sila: 35 })
    new GUIItemData('brassary', 'Brassary', 3, 'Rekawice', { waga: 6, wartosc: 152000, pz: 10, mana: 60, moc: 10, wiedza: 5, res_ogien: 20, res_uro: 20, wym_lvl: 34, wym_moc: 35 })
    new GUIItemData('gest_wladcy', 'Gest Władcy', 3, 'Rekawice', { waga: 8, wartosc: 136000, pz: 60, konda: 40, mana: 20, sila: 12, zreka: 8, wym_lvl: 32, wym_sila: 35 })
    new GUIItemData('fraxy', 'Fraxy', 3, 'Rekawice', { waga: 8, wartosc: 120000, pz: 50, mana: 40, moc: 5, wiedza: 13, res_uro: 10, wym_lvl: 30, wym_moc: 30 })
    new GUIItemData('isthrimm', 'Isthrimm', 3, 'Tarcze Karwasze', { waga: 40, wartosc: 152000, pz: 80, konda: 60, res_ogien: 25, res_klut: 30, res_obuch: 30, res_siek: 31, wym_klasa: 'rycerz', wym_lvl: 34 })
    new GUIItemData('bartaur', 'Bartaur', 3, 'Zbroje', { waga: 15, wartosc: 72000, mana: 50, moc: 5, wiedza: 8, res_klut: 25, res_obuch: 25, res_siek: 25, wym_lvl: 24, wym_wiedza: 25 })
    new GUIItemData('brunnle', 'Brunnle', 3, 'Zbroje', { waga: 30, wartosc: 152000, pz: 60, konda: 40, sila: 7, zreka: 5, res_klut: 29, res_obuch: 31, res_siek: 29, wym_lvl: 34, wym_sila: 35 })

    new GUIItemData('caratris', 'Caratris', 4, 'Amulety', { waga: 2, wartosc: 450000, pz: 30, res_ene: 35, res_ogien: 35, res_uro: 35, res_zimno: 35, wym_lvl: 45 })
    new GUIItemData('smoczy_gnat', 'Smoczy Gnat', 4, 'Bron', { waga: 15, wartosc: 450000, pz: 70, mana: 140, moc: 20, wiedza: 4, obr: 117, r_obr: 'obuchowe', wym_lvl: 45, wym_moc: 45 })
    new GUIItemData('navigon', 'Navigon', 4, 'Pierki', { waga: 2, wartosc: 450000, pz: 80, mana: 50, moc: 12, wiedza: 20, wym_lvl: 45, wym_wiedza: 45 })
    new GUIItemData('nit', 'Nit', 4, 'Pierki', { waga: 2, wartosc: 450000, pz: 80, mana: 50, sila: 12, zreka: 20, wym_lvl: 45, wym_zreka: 45 })
    new GUIItemData('smocze_skrzydlo', 'Smocze Skrzydło', 4, 'Tarcze Karwasze', { waga: 30, wartosc: 450000, pz: 100, konda: 60, sila: 4, zreka: 6, res_klut: 36, res_obuch: 36, res_siek: 36, wym_klasa: 'rycerz', wym_lvl: 45, wym_sila: 45 })

    new GUIItemData('valazan', 'Valazan', 5, 'Amulety', { waga: 3, wartosc: 700000, pz: 50, mana: 90, moc: 9, wiedza: 26, wym_lvl: 50, wym_wiedza: 50 })
    new GUIItemData('danthum', 'Danthum', 5, 'Amulety', { waga: 3, wartosc: 700000, pz: 50, konda: 90, sila: 9, zreka: 26, wym_lvl: 50, wym_zreka: 50 })
    new GUIItemData('ognisty_mlot', 'Ognisty Młot', 5, 'Bron', { waga: 30, wartosc: 950000, pz: 120, konda: 50, sila: 28, zreka: 10, obr: 148, r_obr: 'obuchowe', wym_lvl: 55, wym_sila: 55 })
    new GUIItemData('tangnary', 'Tangnary', 5, 'Buty', { waga: 12, wartosc: 700000, pz: 50, konda: 30, sila: 11, zreka: 13, res_ene: 15, res_klut: 33, res_obuch: 27, res_siek: 33, wym_lvl: 50, wym_zreka: 50 })
    new GUIItemData('gathril', 'Gathril', 5, 'Helmy', { waga: 12, wartosc: 950000, pz: 140, res_ene: 20, res_ogien: 20, res_uro: 10, res_zimno: 20, res_klut: 37, res_obuch: 38, res_siek: 35, wym_lvl: 55 })
    new GUIItemData('czacha', 'Czacha', 5, 'Helmy', { waga: 20, wartosc: 950000, pz: 130, mana: 40, moc: 18, wiedza: 14, res_klut: 25, res_obuch: 25, res_siek: 25, wym_lvl: 55, wym_moc: 55 })
    new GUIItemData('sentrion', 'Sentrion', 5, 'Paski', { waga: 15, wartosc: 1200000, pz: 150, mana: 110, moc: -5, wiedza: 30, res_zimno: 30, wym_lvl: 60, wym_wiedza: 60 })
    new GUIItemData('bryza', 'Bryza', 5, 'Peleryny', { waga: 15, wartosc: 450000, pz: 200, konda: 60, mana: 30, sila: 7, zreka: 9, wym_lvl: 45, wym_zreka: 45 })
    new GUIItemData('nurthil', 'Nurthil', 5, 'Peleryny', { waga: 15, wartosc: 950000, pz: -90, mana: -50, moc: 39, wiedza: 24, res_ogien: 20, wym_lvl: 55, wym_moc: 55 })
    new GUIItemData('xenothor', 'Xenothor', 5, 'Peleryny', { waga: 15, wartosc: 1200000, pz: -40, konda: -50, sila: 39, zreka: 24, res_ogien: 20, wym_lvl: 60, wym_sila: 60 })
    new GUIItemData('balast', 'Balast', 5, 'Pierki', { waga: 3, wartosc: 450000, pz: 250, konda: 40, mana: 40, res_ene: 10, res_ogien: 10, res_uro: 10, res_zimno: 10, wym_lvl: 45 })
    new GUIItemData('vaekany', 'Vaekany', 5, 'Rekawice', { waga: 15, wartosc: 1200000, pz: 20, mana: 310, moc: 14, wiedza: 13, wym_lvl: 60, wym_moc: 60 })
    new GUIItemData('tirhel', 'Tirhel', 5, 'Spodnie', { waga: 20, wartosc: 950000, pz: 140, res_ene: 20, res_ogien: 20, res_uro: 10, res_zimno: 20, res_klut: 38, res_obuch: 35, res_siek: 37, wym_lvl: 55 })
    new GUIItemData('wzorek', 'Wzorek', 5, 'Spodnie', { waga: 20, wartosc: 950000, pz: 140, mana: 110, moc: 4, wiedza: 20, res_klut: 25, res_obuch: 25, res_siek: 25, wym_lvl: 55, wym_wiedza: 55 })
    new GUIItemData('obdartusy', 'Obdartusy', 5, 'Spodnie', { waga: 20, wartosc: 950000, pz: 130, sila: 14, zreka: 10, res_klut: 37, res_obuch: 32, res_siek: 36, wym_lvl: 55, wym_sila: 55 })
    new GUIItemData('berglisy', 'Berglisy', 5, 'Tarcze Karwasze', { waga: 5, wartosc: 1200000, pz: 240, mana: 60, moc: 12, wiedza: 18, wym_lvl: 60, wym_wiedza: 60 })
    new GUIItemData('geury', 'Geury', 5, 'Tarcze Karwasze', { waga: 5, wartosc: 1200000, pz: 240, konda: 60, sila: 12, zreka: 18, wym_lvl: 60, wym_zreka: 60 })
    new GUIItemData('pancerz_komandorski', 'Pancerz Komandorski', 5, 'Zbroje', { waga: 22, wartosc: 450000, pz: 60, konda: 30, mana: 80, moc: 8, wiedza: 12, res_klut: 26, res_obuch: 28, res_siek: 26, wym_lvl: 45, wym_wiedza: 45 })
    new GUIItemData('virthil', 'Virthil', 5, 'Zbroje', { waga: 40, wartosc: 950000, pz: 140, res_ene: 20, res_ogien: 20, res_uro: 10, res_zimno: 20, res_klut: 35, res_obuch: 37, res_siek: 38, wym_lvl: 55 })
    new GUIItemData('diabolo', 'Diabolo', 5, 'Zbroje', { waga: 15, wartosc: 950000, pz: 150, mana: 150, moc: 28, wiedza: -9, res_klut: 25, res_obuch: 25, res_siek: 25, wym_lvl: 55, wym_moc: 55 })
    new GUIItemData('opoka_bogow', 'Opoka Bogów', 5, 'Zbroje', { waga: 15, wartosc: 950000, pz: 120, konda: 120, sila: 10, zreka: 9, res_klut: 33, res_obuch: 29, res_siek: 28, wym_lvl: 55, wym_sila: 55 })

    new GUIItemData('zemsta_ivravula', 'Zemsta Ivravula', 6, 'Amulety', { waga: 2, wartosc: 2200000, pz: 500, konda: 40, mana: 40, res_ene: 10, res_ogien: 10, res_uro: 10, res_zimno: 10, wym_lvl: 70 })
    new GUIItemData('virral', 'Virral', 6, 'Bron', { waga: 15, wartosc: 1500000, pz: 100, konda: 100, mana: 30, sila: 15, zreka: 25, obr: 148, r_obr: 'kłute', wym_lvl: 63, wym_zreka: 60 })
    new GUIItemData('urntsul', 'Urntsul', 6, 'Bron', { waga: 4, wartosc: 1500000, pz: 290, mana: 100, moc: 14, wiedza: 10, obr: 148, r_obr: 'sieczne', wym_lvl: 63, wym_moc: 60 })
    new GUIItemData('buoriany', 'Buoriany', 6, 'Bron', { waga: 20, wartosc: 2200000, pz: 100, konda: 70, mana: 50, sila: 34, zreka: 14, obr: 160, r_obr: 'sieczne', wym_lvl: 70, wym_sila: 70 })
    new GUIItemData('lawina', 'Lawina', 6, 'Bron', { waga: 30, wartosc: 2200000, pz: 150, konda: 30, mana: 20, sila: 30, zreka: 20, obr: 143, r_obr: 'obuchowe', wym_lvl: 70, wym_sila: 70 })
    new GUIItemData('thorimmy', 'Thorimmy', 6, 'Buty', { waga: 15, wartosc: 2200000, pz: 160, mana: 40, moc: 9, wiedza: 20, res_zimno: 30, res_klut: 30, res_obuch: 30, res_siek: 30, wym_lvl: 70, wym_wiedza: 70 })
    new GUIItemData('ghaitarog', 'Ghaitarog', 6, 'Helmy', { waga: 15, wartosc: 1700000, pz: 120, konda: 100, sila: 7, zreka: 9, res_zimno: 30, res_klut: 35, res_obuch: 35, res_siek: 35, wym_lvl: 65, wym_zreka: 65 })
    new GUIItemData('dagorilm', 'Dagorilm', 6, 'Paski', { waga: 15, wartosc: 2200000, pz: 150, konda: 80, mana: 20, sila: 24, zreka: 21, wym_lvl: 70, wym_sila: 70 })
    new GUIItemData('debba', 'Debba', 6, 'Peleryny', { waga: 10, wartosc: 1700000, pz: 250, konda: 40, mana: 40, zreka: 20, res_zimno: 40, wym_lvl: 65, wym_zreka: 65 })
    new GUIItemData('biltabandury', 'Biltabandury', 6, 'Rekawice', { waga: 10, wartosc: 1700000, pz: 200, konda: 80, mana: 80, zreka: 20, res_zimno: 30, wym_lvl: 65, wym_zreka: 65 })

    new GUIItemData('vogurun', 'Vogurun', 7, 'Amulety', { waga: 2, wartosc: 2700000, moc: 38, wiedza: 37, wym_lvl: 75, wym_moc: 75 })
    new GUIItemData('yurugu', 'Yurugu', 7, 'Amulety', { waga: 2, wartosc: 2700000, sila: 38, zreka: 37, wym_lvl: 75, wym_sila: 75 })
    new GUIItemData('istav', 'Istav', 7, 'Bron', { waga: 20, wartosc: 2700000, pz: 130, mana: 130, moc: 7, wiedza: 30, obr: 169, r_obr: 'obuchowe', res_uro: 20, res_zimno: 20, wym_lvl: 75, wym_wiedza: 75 })
    new GUIItemData('wladca_losu', 'Władca Losu', 7, 'Bron', { waga: 17, wartosc: 2700000, pz: 80, konda: 50, mana: 50, moc: 37, wiedza: 20, obr: 179, r_obr: 'obuchowe', wym_lvl: 75, wym_moc: 75 })
    new GUIItemData('fanga', 'Fanga', 7, 'Bron', { waga: 15, wartosc: 2700000, pz: 130, konda: 100, mana: 90, sila: 10, zreka: 33, obr: 179, r_obr: 'obuchowe', wym_lvl: 75, wym_zreka: 75 })
    new GUIItemData('otwieracz', 'Otwieracz', 7, 'Bron', { waga: 24, wartosc: 2700000, pz: 260, konda: 200, mana: 20, sila: 10, zreka: 8, obr: 160, r_obr: 'sieczne', wym_lvl: 75, wym_sila: 75 })
    new GUIItemData('gjolmar', 'Gjolmar', 7, 'Bron', { waga: 15, wartosc: 4900000, pz: 150, konda: 50, mana: 50, sila: 20, zreka: 40, obr: 196, r_obr: 'kłute', wym_lvl: 85, wym_zreka: 85 })
    new GUIItemData('batagur', 'Batagur', 7, 'Bron', { waga: 40, wartosc: 4900000, pz: 80, konda: 200, sila: 47, zreka: 10, obr: 217, r_obr: 'obuchowe', wym_lvl: 85, wym_sila: 85 })
    new GUIItemData('virveny', 'Virveny', 7, 'Buty', { waga: 20, wartosc: 2700000, pz: 150, konda: 150, mana: 50, sila: 7, zreka: 9, res_ogien: 15, res_klut: 36, res_obuch: 38, res_siek: 35, wym_lvl: 75, wym_zreka: 75 })
    new GUIItemData('sigil', 'Sigil', 7, 'Helmy', { waga: 18, wartosc: 2700000, pz: 180, mana: 130, moc: 10, wiedza: 13, res_ene: 25, res_klut: 31, res_obuch: 32, res_siek: 31, wym_lvl: 75, wym_wiedza: 75 })
    new GUIItemData('powrot_ivravula', 'Powrót Ivravula', 7, 'Peleryny', { waga: 12, wartosc: 3200000, pz: 100, konda: 120, mana: 80, sila: 14, zreka: 24, res_ene: 20, res_ogien: 20, wym_lvl: 80, wym_zreka: 80 })
    new GUIItemData('dracorporis', 'Dracorporis', 7, 'Peleryny', { waga: 15, wartosc: 2700000, pz: 90, mana: 60, moc: 38, wiedza: 22, wym_lvl: 75, wym_moc: 75 })
    new GUIItemData('griv', 'Griv', 7, 'Pierki', { waga: 1, wartosc: 2700000, pz: 550, konda: 100, mana: 100, wym_lvl: 75 })
    new GUIItemData('zadry', 'Zadry', 7, 'Rekawice', { waga: 6, wartosc: 2700000, pz: 180, konda: 40, sila: 25, zreka: 28, wym_lvl: 75, wym_zreka: 75 })
    new GUIItemData('varrvy', 'Varrvy', 7, 'Spodnie', { waga: 40, wartosc: 2700000, pz: 50, konda: 30, sila: 31, zreka: 14, res_klut: 39, res_obuch: 38, res_siek: 38, wym_lvl: 75, wym_sila: 75 })
    new GUIItemData('nadzieja_pokolen', 'Nadzieja Pokoleń', 7, 'Zbroje', { waga: 18, wartosc: 3200000, pz: 120, konda: 10, moc: 13, wiedza: 20, res_ene: 20, res_ogien: 20, res_klut: 32, res_obuch: 35, res_siek: 33, wym_lvl: 80, wym_wiedza: 80 })
    new GUIItemData('harttraum', 'Harttraum', 7, 'Zbroje', { waga: 45, wartosc: 2700000, pz: 120, konda: 30, sila: 16, zreka: 26, res_klut: 35, res_obuch: 35, res_siek: 35, wym_lvl: 75, wym_zreka: 75 })

    new GUIItemData('aqueniry', 'Aqueniry', 8, 'Buty', { waga: 12, wartosc: 4900000, pz: 150, mana: 20, moc: 19, wiedza: 30, res_klut: 35, res_obuch: 37, res_siek: 35, wym_lvl: 85, wym_wiedza: 85 })
    new GUIItemData('pysk', 'Pysk', 8, 'Helmy', { waga: 19, wartosc: 6600000, pz: 180, konda: 50, sila: 26, zreka: 23, res_klut: 35, res_obuch: 35, res_siek: 35, wym_lvl: 90, wym_sila: 90 })
    new GUIItemData('exuvium', 'Exuvium', 8, 'Paski', { waga: 12, wartosc: 6600000, pz: 350, mana: 100, moc: 5, wiedza: 40, wym_lvl: 90, wym_wiedza: 90 })
    new GUIItemData('nurt', 'Nurt', 8, 'Paski', { waga: 13, wartosc: 4900000, pz: 200, konda: 60, mana: 20, sila: 19, zreka: 38, wym_lvl: 85, wym_zreka: 85 })
    new GUIItemData('tsunami', 'Tsunami', 8, 'Peleryny', { waga: 16, wartosc: 4900000, pz: 250, mana: 170, moc: 8, wiedza: 35, wym_lvl: 85, wym_wiedza: 85 })
    new GUIItemData('skogan', 'Skogan', 8, 'Pierki', { waga: 2, wartosc: 4900000, pz: 120, konda: 20, mana: 20, sila: 44, zreka: 25, wym_lvl: 85, wym_sila: 85 })
    new GUIItemData('mauremys', 'Mauremys', 8, 'Pierki', { waga: 3, wartosc: 4900000, pz: 100, mana: 50, moc: 38, wiedza: 32, wym_lvl: 85, wym_moc: 85 })
    new GUIItemData('pazury', 'Pazury', 8, 'Rekawice', { waga: 10, wartosc: 6600000, pz: 120, mana: 320, moc: 22, wiedza: 24, wym_lvl: 90, wym_wiedza: 90 })
    new GUIItemData('skiilfy', 'Skiilfy', 8, 'Spodnie', { waga: 14, wartosc: 4900000, pz: 150, mana: 50, moc: 22, wiedza: 25, res_klut: 35, res_obuch: 35, res_siek: 35, wym_lvl: 85, wym_wiedza: 85 })
    new GUIItemData('aquariusy', 'Aquariusy', 8, 'Spodnie', { waga: 32, wartosc: 4900000, pz: 250, konda: 80, sila: 8, zreka: 25, res_klut: 36, res_obuch: 36, res_siek: 36, wym_lvl: 85, wym_zreka: 85 })
    new GUIItemData('karapaks', 'Karapaks', 8, 'Tarcze Karwasze', { waga: 35, wartosc: 4900000, pz: 200, konda: 200, mana: 10, sila: 9, zreka: 11, res_klut: 40, res_obuch: 40, res_siek: 40, wym_klasa: 'rycerz', wym_lvl: 85, wym_zreka: 85 })
    new GUIItemData('dmorlung', 'Dmorlung', 8, 'Zbroje', { waga: 20, wartosc: 8300000, pz: 200, konda: 100, sila: 19, zreka: 18, res_zimno: 15, res_klut: 38, res_obuch: 38, res_siek: 38, wym_lvl: 95, wym_sila: 95 })
    new GUIItemData('vorleah', 'Vorleah', 8, 'Zbroje', { waga: 20, wartosc: 8300000, pz: 200, konda: 20, mana: 100, moc: 16, wiedza: 25, res_zimno: 15, res_klut: 35, res_obuch: 35, res_siek: 35, wym_lvl: 95, wym_wiedza: 95 })

    new GUIItemData('htagan', 'Htagan', 9, 'Helmy', { waga: 18, wartosc: 10000000, pz: 250, mana: 50, moc: 25, wiedza: 24, res_uro: 10, res_klut: 35, res_obuch: 35, res_siek: 35, wym_lvl: 100, wym_moc: 100 })
    new GUIItemData('angwallion', 'Angwallion', 9, 'Peleryny', { waga: 24, wartosc: 10000000, pz: 200, konda: 100, mana: 100, sila: 12, zreka: 30, res_ene: 15, res_ogien: 15, res_uro: 15, res_zimno: 15, wym_lvl: 100, wym_zreka: 100 })

    new GUIItemData('serce_seleny', 'Serce Seleny', 10, 'Amulety', { waga: 3, wartosc: 22500000, pz: 350, konda: 100, mana: 100, res_ene: 55, res_ogien: 55, res_uro: 55, res_zimno: 55, wym_lvl: 110 })
    new GUIItemData('mallus_selenorum', 'Mallus Selenorum', 10, 'Bron', { waga: 40, wartosc: 22500000, pz: 400, konda: 250, mana: 100, sila: 26, zreka: 20, obr: 211, r_obr: 'sieczne', wym_lvl: 110, wym_sila: 110 })
    new GUIItemData('szpony', 'Szpony', 10, 'Bron', { waga: 10, wartosc: 22500000, pz: 250, konda: 90, mana: 200, sila: 19, zreka: 48, obr: 239, r_obr: 'sieczne', wym_lvl: 110, wym_zreka: 110 })
    new GUIItemData('taehal', 'Taehal', 10, 'Bron', { waga: 15, wartosc: 22500000, pz: 300, konda: 130, mana: 90, sila: 18, zreka: 51, obr: 239, r_obr: 'kłute', wym_lvl: 110, wym_zreka: 110 })
    new GUIItemData('bol', 'Ból', 10, 'Bron', { waga: 5, wartosc: 22500000, pz: 400, konda: 50, mana: 150, moc: 21, wiedza: 40, obr: 239, r_obr: 'kłute', wym_lvl: 110, wym_wiedza: 110 })
    new GUIItemData('ciern', 'Cierń', 10, 'Bron', { waga: 30, wartosc: 22500000, pz: 250, konda: 160, sila: 50, zreka: 30, obr: 266, r_obr: 'sieczne', wym_lvl: 110, wym_sila: 110 })
    new GUIItemData('trojzab_admiralski', 'Trójząb Admiralski', 10, 'Bron', { waga: 18, wartosc: 22500000, pz: 140, konda: 30, mana: 50, moc: 65, wiedza: 34, obr: 239, r_obr: 'obuchowe', wym_lvl: 110, wym_moc: 110 })
    new GUIItemData('alendry', 'Alendry', 10, 'Buty', { waga: 16, wartosc: 22500000, pz: 200, mana: 40, moc: 16, wiedza: 43, res_ene: 15, res_ogien: 15, res_uro: 15, res_zimno: 15, res_klut: 37, res_obuch: 37, res_siek: 37, wym_lvl: 110, wym_wiedza: 110 })
    new GUIItemData('cierpietniki', 'Cierpiętniki', 10, 'Buty', { waga: 19, wartosc: 22500000, pz: 120, konda: 50, sila: 49, zreka: 31, res_klut: 40, res_obuch: 40, res_siek: 40, wym_lvl: 110, wym_sila: 110 })
    new GUIItemData('envile', 'Envile', 10, 'Buty', { waga: 17, wartosc: 22500000, pz: 140, mana: 60, moc: 50, wiedza: 39, res_klut: 30, res_obuch: 30, res_siek: 30, wym_lvl: 110, wym_moc: 110 })
    new GUIItemData('pamiec_morany', 'Pamięć Morany', 10, 'Helmy', { waga: 15, wartosc: 35000000, pz: 300, konda: 120, sila: 29, zreka: 25, res_ene: 15, res_ogien: 15, res_uro: 15, res_zimno: 15, res_klut: 45, res_obuch: 45, res_siek: 45, wym_lvl: 120, wym_sila: 120 })
    new GUIItemData('milosc_morany', 'Miłość Morany', 10, 'Helmy', { waga: 15, wartosc: 35000000, pz: 340, mana: 100, moc: 27, wiedza: 25, res_ene: 20, res_ogien: 20, res_uro: 20, res_zimno: 20, res_klut: 40, res_obuch: 40, res_siek: 40, wym_lvl: 120, wym_moc: 120 })
    new GUIItemData('groza_seleny', 'Groza Seleny', 10, 'Paski', { waga: 3, wartosc: 22500000, pz: 230, konda: 70, mana: 20, sila: 16, zreka: 55, res_ene: 15, res_ogien: 15, res_uro: 15, res_zimno: 15, wym_lvl: 110, wym_zreka: 110 })
    new GUIItemData('nienawisc_draugula', 'Nienawiść Draugula', 10, 'Paski', { waga: 8, wartosc: 22500000, pz: 120, konda: 40, sila: 63, zreka: 42, wym_lvl: 110, wym_sila: 110 })
    new GUIItemData('objecia_morany', 'Objęcia Morany', 10, 'Paski', { waga: 7, wartosc: 28750000, pz: 280, konda: 20, mana: 80, moc: 40, wiedza: 45, res_uro: 10, res_zimno: 20, wym_lvl: 115, wym_wiedza: 115 })
    new GUIItemData('hanba_seleny', 'Hańba Seleny', 10, 'Peleryny', { waga: 14, wartosc: 22500000, pz: 280, mana: 180, moc: 17, wiedza: 40, res_ene: 15, res_ogien: 15, res_uro: 15, res_zimno: 15, wym_lvl: 110, wym_wiedza: 110 })
    new GUIItemData('admiralski_gronostaj', 'Admiralski Gronostaj', 10, 'Peleryny', { waga: 15, wartosc: 28750000, pz: 300, konda: 140, mana: 80, sila: 35, zreka: 45, wym_lvl: 115, wym_zreka: 115 })
    new GUIItemData('zaglada_ludow', 'Zagłada Ludów', 10, 'Pierki', { waga: 2, wartosc: 22500000, pz: 140, konda: 60, mana: 40, sila: 50, zreka: 50, wym_lvl: 110, wym_sila: 110 })
    new GUIItemData('przysiega_draugula', 'Przysięga Draugula', 10, 'Pierki', { waga: 2, wartosc: 22500000, pz: 110, konda: 40, mana: 60, moc: 50, wiedza: 50, wym_lvl: 110, wym_moc: 110 })
    new GUIItemData('szpony_seimhi', 'Szpony Seimhi', 10, 'Rekawice', { waga: 12, wartosc: 28750000, pz: 300, konda: 50, mana: 240, moc: 28, wiedza: 45, wym_lvl: 115, wym_wiedza: 115 })
    new GUIItemData('aeterus_passio', 'Aeterus Passio', 10, 'Rekawice', { waga: 18, wartosc: 28750000, pz: 300, konda: 60, mana: 20, sila: 40, zreka: 45, res_uro: 10, res_zimno: 20, wym_lvl: 115, wym_zreka: 115 })
    new GUIItemData('erbaile', 'Erbaile', 10, 'Spodnie', { waga: 21, wartosc: 22500000, pz: 220, konda: 130, sila: 11, zreka: 33, res_ene: 15, res_ogien: 15, res_uro: 15, res_zimno: 15, res_klut: 40, res_obuch: 40, res_siek: 40, wym_lvl: 110, wym_zreka: 110 })
    new GUIItemData('udreki', 'Udręki', 10, 'Spodnie', { waga: 15, wartosc: 22500000, pz: 80, mana: 100, moc: 44, wiedza: 36, res_klut: 39, res_obuch: 39, res_siek: 39, wym_lvl: 110, wym_moc: 110 })
    new GUIItemData('kil', 'Kil', 10, 'Tarcze Karwasze', { waga: 35, wartosc: 22500000, pz: 280, konda: 150, mana: 80, sila: 20, zreka: 26, res_klut: 40, res_obuch: 40, res_siek: 40, wym_klasa: 'rycerz', wym_lvl: 110, wym_zreka: 110 })
    new GUIItemData('undurisy', 'Undurisy', 10, 'Tarcze Karwasze', { waga: 5, wartosc: 22500000, pz: 90, konda: 120, mana: 40, sila: 53, zreka: 43, wym_lvl: 110, wym_sila: 110 })
    new GUIItemData('ariarchy', 'Ariarchy', 10, 'Tarcze Karwasze', { waga: 5, wartosc: 22500000, pz: 80, konda: 50, mana: 200, moc: 45, wiedza: 43, wym_lvl: 110, wym_moc: 110 })
    new GUIItemData('takerony', 'Takerony', 10, 'Tarcze Karwasze', { waga: 5, wartosc: 22500000, pz: 700, konda: 110, mana: 50, sila: 10, zreka: 25, wym_lvl: 110, wym_zreka: 110 })
    new GUIItemData('inavoxy', 'Inavoxy', 10, 'Tarcze Karwasze', { waga: 5, wartosc: 22500000, pz: 700, konda: 50, mana: 110, moc: 10, wiedza: 25, wym_lvl: 110, wym_wiedza: 110 })

    new GUIItemData('ortasis', 'Ortasis', 11, 'Amulety', { waga: 2, wartosc: 50750000, pz: 310, konda: 30, mana: 170, moc: 40, wiedza: 58, res_ene: 30, res_ogien: 10, wym_lvl: 127, wym_wiedza: 125 })
    new GUIItemData('dorbis', 'Dorbis', 11, 'Amulety', { waga: 2, wartosc: 50750000, pz: 310, konda: 170, mana: 30, sila: 45, zreka: 53, res_ene: 30, res_ogien: 10, wym_lvl: 127, wym_zreka: 125 })
    new GUIItemData('arhauty', 'Arhauty', 11, 'Buty', { waga: 21, wartosc: 50750000, pz: 750, konda: 70, zreka: 25, res_ene: 15, res_ogien: 15, res_uro: 15, res_zimno: 15, res_klut: 50, res_obuch: 50, res_siek: 50, wym_lvl: 127, wym_sila: 50, wym_zreka: 50 })
    new GUIItemData('cien_tarula', 'Cień Tarula', 11, 'Peleryny', { waga: 8, wartosc: 57500000, pz: 120, konda: 20, mana: 150, moc: 68, wiedza: 63, res_ene: 15, res_ogien: 15, wym_lvl: 130, wym_moc: 130 })
    new GUIItemData('temary', 'Temary', 11, 'Spodnie', { waga: 19, wartosc: 50750000, pz: 750, mana: 70, wiedza: 25, res_ene: 20, res_ogien: 20, res_uro: 20, res_zimno: 20, res_klut: 45, res_obuch: 45, res_siek: 45, wym_lvl: 127, wym_moc: 50, wym_wiedza: 50 })
    new GUIItemData('ziraki', 'Ziraki', 11, 'Spodnie', { waga: 17, wartosc: 57500000, pz: 140, konda: 60, sila: 63, zreka: 55, res_ene: 15, res_ogien: 15, res_klut: 38, res_obuch: 38, res_siek: 38, wym_lvl: 130, wym_sila: 130 })

    new GUIItemData('salmurn', 'Salmurn', 12, 'Zbroje', { waga: 25, wartosc: 68750000, pz: 400, konda: 100, mana: 80, sila: 22, zreka: 48, res_ene: 15, res_ogien: 15, res_uro: 15, res_zimno: 15, res_klut: 50, res_obuch: 50, res_siek: 50, wym_lvl: 135, wym_sila: 50, wym_zreka: 50 })
    new GUIItemData('zalla', 'Zalla', 12, 'Zbroje', { waga: 22, wartosc: 68750000, pz: 400, konda: 50, mana: 130, moc: 24, wiedza: 46, res_ene: 20, res_ogien: 20, res_uro: 20, res_zimno: 20, res_klut: 45, res_obuch: 45, res_siek: 45, wym_lvl: 135, wym_moc: 50, wym_wiedza: 50 })

    new GUIItemData('dar_skrzydlatej', 'Dar Skrzydlatej', 12, 'Pierki', { waga: 0, wartosc: 0, wym_lvl: 0 })
    new GUIItemData('remigesy', 'Remigesy', 12, 'Rekawice', { waga: 0, wartosc: 0, wym_lvl: 0 })
    new GUIItemData('wyrok_hellara', 'Wyrok Hellara', 12, 'Paski', { waga: 0, wartosc: 0, wym_lvl: 0 })
    new GUIItemData('vengur', 'Vengur', 12, 'Peleryny', { waga: 0, wartosc: 0, wym_lvl: 0 })
    new GUIItemData('voglery', 'Voglery', 12, 'Rekawice', { waga: 0, wartosc: 0, wym_lvl: 0 })


    new GUIItemData('allenor', 'Allenor', 9, 'Bron', {}, true);
    new GUIItemData('attawa', 'Attawa', 9, 'Bron', {}, true);
    new GUIItemData('gorthdar', 'Gorthdar', 9, 'Bron', {}, true);
    new GUIItemData('imisindo', 'Imisindo', 9, 'Bron', {}, true);
    new GUIItemData('latarnia_zycia', 'Latarnia Życia', 9, 'Bron', {}, true);
    new GUIItemData('washi', 'Washi', 9, 'Bron', {}, true);
    new GUIItemData('zmij', 'Żmij', 9, 'Bron', {}, true);
}



initData()
GUI.init()