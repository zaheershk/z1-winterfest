const competitionsData = [
    {
        category: "Cultural",
        competitions: [
            { name: "Dance", ageGroups: ["3-5"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Dance-Bollywood", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Dance-Classical", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Singing", ageGroups: ["3-5"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Singing-Classical Bollywood", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Singing-Light Bollywood", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Drawing", ageGroups: ["3-5", "6-9", "10-13", "14-17"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Fancy Dress", ageGroups: ["3-5", "6-9", "10-13", "14-17"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Master Chef (Cooking without fire)", ageGroups: ["10-13", "14-17"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Master Chef", ageGroups: ["18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Musical instrument", ageGroups: ["3-5", "6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Rangoli", ageGroups: ["10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Jhoti Chita", ageGroups: ["10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
        ],
    },
    {
        category: "Games",
        competitions: [
            { name: "Cards-29 (Doubles)", ageGroups: ["18-35", "36-55", "56+"], teamBased: true, displayAgeGroups: "18 & above", numberOfWinners: 2, genderSeparated: false },            
            { name: "Carrom (Doubles)", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: true, displayAgeGroups: "Under 10, 10-17, 18 & above", numberOfWinners: 2, genderSeparated: false },
            { name: "Emoji Run", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Jump In & Out", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Lemon & Spoon Race", ageGroups: ["3-5", "6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Sack Race", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: true },
            { name: "Mirror Walk", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Musical Chairs", ageGroups: ["3-5", "6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Build an Object (Teams of 3)", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: true, displayAgeGroups: "Under 10, 10-17, 18 & above", numberOfWinners: 3, genderSeparated: false },
            { name: "Treasure Hunt (Teams of 4)", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: true, displayAgeGroups: "Under 10, 10-17, 18 & above", numberOfWinners: 4, genderSeparated: false },
            { name: "Tug of War (Teams of 6)", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: true, displayAgeGroups: "Under 18, 18-35, 36-55, 56 & above", numberOfWinners: 6, genderSeparated: true },
        ],
    },
    {
        category: "Sports",
        competitions: [
            { name: "8 Ball Pool", ageGroups: ["18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Chess", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Slow Cycling", ageGroups: ["6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Swimming", ageGroups: ["3-5", "6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: true },
        ],
    },
    {
        category: "Other",
        competitions: [
            { name: "Walkathon", ageGroups: ["3-5", "6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 0, genderSeparated: false },
            { name: "Tambola", ageGroups: ["3-5", "6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 1, genderSeparated: false },
            { name: "Bollywood Quiz (Teams of 3)", ageGroups: ["3-5", "6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: true, displayAgeGroups: "No age category specification", numberOfWinners: 3, genderSeparated: false },
        ],
    },
    {
        category: "Skip Competitions",
        competitions: [
            { name: "None", ageGroups: ["3-5", "6-9", "10-13", "14-17", "18-35", "36-55", "56+"], teamBased: false, displayAgeGroups: "", numberOfWinners: 0, genderSeparated: false },
        ],
    }
];
