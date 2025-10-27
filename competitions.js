const competitionsData = [
    {
        category: "Cultural",
        competitions: [
            { name: "Dance", ageGroups: ["3-5"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Dance-Bollywood", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Dance-Classical", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Singing", ageGroups: ["3-5"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Singing-Classical Bollywood", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Singing-Light Bollywood", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Drawing", ageGroups: ["3-5", "6-9", "10-13", "14-17"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Fancy Dress", ageGroups: ["3-5", "6-9", "10-13", "14-17"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Master Chef (Cooking without fire)", ageGroups: ["10-13", "14-17"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Master Chef", ageGroups: ["18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Musical instrument", ageGroups: ["3-5", "6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Rangoli", ageGroups: ["10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Jhoti Chita", ageGroups: ["10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
        ],
    },
    {
        category: "Games",
        competitions: [
            { name: "Cards-29 (Doubles)", ageGroups: ["18-35", "36-55", "56+"], teamBased: true, displayAgeGroups: "18 & above", numberOfWinners: 2 },            
            { name: "Carrom (Doubles)", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: true, displayAgeGroups: "Under 10, 10-17, 18 & above", numberOfWinners: 2 },
            { name: "Emoji Run", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Jump In & Out", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Lemon & Spoon Race", ageGroups: ["3-5", "6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Sack Race", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Mirror Walk", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Musical Chairs", ageGroups: ["3-5", "6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Build an Object (Teams of 3)", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: true, displayAgeGroups: "Under 10, 10-17, 18 & above", numberOfWinners: 3 },
            { name: "Treasure Hunt (Teams of 4)", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: true, displayAgeGroups: "Under 10, 10-17, 18 & above", numberOfWinners: 4 },
            { name: "Tug of War (Teams of 6)", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: true, displayAgeGroups: "Under 18, 18-35, 36-55, 56 & above", numberOfWinners: 6 },
        ],
    },
    {
        category: "Sports",
        competitions: [
            { name: "8 Ball Pool", ageGroups: ["18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Chess", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Slow Cycling", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Swimming", ageGroups: ["3-5", "6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
        ],
    },
    {
        category: "Other",
        competitions: [
            { name: "Walkathon", ageGroups: ["3-5", "6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 0 },
            { name: "Tambola", ageGroups: ["3-5", "6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1 },
            { name: "Bollywood Quiz (Teams of 3)", ageGroups: ["3-5", "6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: true, displayAgeGroups: "No age category specification", numberOfWinners: 3 },
        ],
    }
];
