const fs = require('fs')
const _ = require('lodash')
const { readFile } = require('./downloader')

const percent = (a, b) => `${(a/b*100).toFixed(1)}%`

const cardsOfType = ({ cards, filter, compareAgainstFilter }) => {
    const getTypeBreakdown = ({ cardsOfAttribute, attribute, all }) => {
        const f = all ? filter : compareAgainstFilter ||  filter;
        const creatures = cardsOfAttribute.filter(f)
        const numCreatures = creatures.length

        return all
            ? {
                  [attribute]: {
                      odds: percent(numCreatures, all.num),
                      creatures: creatures.map(({ Name }) => Name),
                  },
              }
            : { num: numCreatures }
    }
    const allCardsTypeBreakdown = getTypeBreakdown({
        cardsOfAttribute: cards,
        attribute: 'all',
    })

    return [
        'strength',
        'intelligence',
        'willpower',
        'agility',
        'endurance',
        'neutral',
    ]
        .map(attribute => ({
            attribute,
            cardsOfAttribute: cards.filter(({ Attributes }) =>
                Attributes.includes(attribute)
            ),
        }))
        .map(args => getTypeBreakdown({ ...args, all: allCardsTypeBreakdown }))
        .reduce((prev, next) => ({
            ...prev,
            ...next,
        }))
}

const makeRows = () => {
    const costTable = _.range(0, 13)
        .map(cost => ({
            title: `Random ${cost}-cost creature`,
            ...cardsOfType({ 
                cards,
                filter: (c) => c.Type === 'Creature' && parseInt(c['Magicka Cost'], 10) === cost,
    })}));
    const animalRow = {
        title: 'Random Animal',
        ...cardsOfType({
            cards, 
            filter: (c) => c.Type === 'Creature' && [ 'Beast', 'Fish', 'Mammoth', 'Mudcrab', 'Netch', 'Reptile', 'Skeever', 'Spider', 'Wolf'].includes(c.Race) || c.Name === 'Reflective Automaton',
        })
    };
    const guardRow = {
        title: 'Random Guard',
        ...cardsOfType({
            cards,
            filter: (c) => c.Type === 'Creature' && c.Keywords.split(',').includes('Guard'),
        })
    }
    const suranPawnbrokerRow = {
        title: 'Suran Pawnbroker => creature/item',
        ...cardsOfType({
            cards,
            filter: (c) => (['Creature', 'Item'].includes(c.Type) || c.Name === 'Vvardvark Experiment') && c['Magicka Cost'] === '0',
            compareAgainstFilter: (c) => c['Magicka Cost'] === '0',
        })
    }
    const randomCreatureRow = {
        title: 'Random Creature',
        ...cardsOfType({
            cards,
            filter: (c) => c.Type === 'Creature',
        })
    }
    const randomItemRow = {
        title: 'Random Item',
        ...cardsOfType({
            cards,
            filter: (c) => c.Type === 'Item',
        })
    }
    const randomSupportRow = {
        title: 'Random Support',
        ...cardsOfType({
            cards,
            filter: (c) => c.Type === 'Support',
        })
    }
    const randomDaedraRow = {
        title: 'Random Daedra',
        ...cardsOfType({
            cards,
            filter: (c) => c.Type === 'Creature' && c.Race === 'Daedra' || c.Name === 'Reflective Automaton',
        })
    }
    const randomLegendRow = {
        title: 'Heroic Rebirth',
        ...cardsOfType({
            cards,
            filter: (c) => c.Type === 'Creature' && c.Rarity === 'Legendary - Unique',
        })
    }
    const randomElixir = {
        title: 'Shivering Apothecary',
        ...cardsOfType({
            cards,
            filter: (c) => c.Type === 'Support' && c.Name.includes('Elixir'),
        })
    }

    const rows = [
        animalRow, 
        guardRow, 
        suranPawnbrokerRow,
        randomCreatureRow,
        randomItemRow,
        randomSupportRow,
        randomElixir,
        randomDaedraRow,
        randomLegendRow,
        ...costTable, 
    ]
}

const mungeCards = (cards) => {
    return cards.map((card) => {
        return _.fromPairs(_.toPairs(card).map(([key, value]) => [_.camelCase(key), value]));
    });
}

;(async () => {
    const cardFileNames = fs.readdirSync('./cards')
    const promises = cardFileNames
        .filter(n => n.endsWith('.json'))
        .map(n => `./cards/${n}`)
        .map(readFile)
    const cards = await Promise.all(promises)
    const mungedCards = mungeCards(cards);
    
    fs.writeFileSync('./collection.json', `export const cards = ${JSON.stringify(mungedCards, null, 2)}`);
})()
