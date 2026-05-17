export const PRODUCT_CATEGORIES = {
    electronics: {
        id: 'electronics',
        name: 'Electronics',
        displayName: 'Electronics',
        icon: '📱',
        color: '#3498db',
        bgColor: '#EBF5FB',
        subcategories: [
            { id: 'phone-chargers', name: 'Phone chargers', icon: '🔌' },
            { id: 'earphones', name: 'Earphones', icon: '🎧' },
            { id: 'usb-cables', name: 'USB cables', icon: '🔗' },
            { id: 'power-banks', name: 'Power banks', icon: '🔋' },
            { id: 'mouse', name: 'Mouse', icon: '🖱️' },
            { id: 'flash-drives', name: 'Flash drives', icon: '💾' },
            { id: 'phone-cases', name: 'Phone cases', icon: '📱' }
        ]
    },
    stationery: {
        id: 'stationery',
        name: 'Stationery',
        displayName: 'Stationery',
        icon: '✏️',
        color: '#e67e22',
        bgColor: '#FEF5E7',
        subcategories: [
            { id: 'pens', name: 'Pens', icon: '✒️' },
            { id: 'pencils', name: 'Pencils', icon: '✏️' },
            { id: 'notebooks', name: 'Notebooks', icon: '📓' },
            { id: 'textbooks', name: 'Textbooks', icon: '📚' },
            { id: 'sticky-notes', name: 'Sticky notes', icon: '📝' },
            { id: 'highlighters', name: 'Highlighters', icon: '🟡' },
            { id: 'files-folders', name: 'Files and folders', icon: '📁' },
            { id: 'calculators', name: 'Calculators', icon: '🧮' },
            { id: 'geometry-sets', name: 'Geometry sets', icon: '📐' }
        ]
    },
    food: {
        id: 'food',
        name: 'Food & Snacks',
        displayName: 'Food & Snacks',
        icon: '🍕',
        color: '#e74c3c',
        bgColor: '#FDEDEC',
        subcategories: [
            { id: 'chips', name: 'Chips', icon: '🥔' },
            { id: 'biscuits', name: 'Biscuits', icon: '🍪' },
            { id: 'instant-noodles', name: 'Instant noodles', icon: '🍜' },
            { id: 'chocolates', name: 'Chocolates', icon: '🍫' },
            { id: 'soft-drinks', name: 'Soft drinks', icon: '🥤' },
            { id: 'water-bottles', name: 'Water bottles', icon: '💧' },
            { id: 'coffee', name: 'Coffee', icon: '☕' },
            { id: 'energy-drinks', name: 'Energy drinks', icon: '⚡' }
        ]
    },
    personalCare: {
        id: 'personalCare',
        name: 'Personal Care',
        displayName: 'Personal Care',
        icon: '🧴',
        color: '#9b59b6',
        bgColor: '#F4ECF7',
        subcategories: [
            { id: 'toothpaste', name: 'Toothpaste', icon: '🪥' },
            { id: 'toothbrush', name: 'Toothbrush', icon: '🪥' },
            { id: 'soap', name: 'Soap', icon: '🧼' },
            { id: 'shampoo', name: 'Shampoo', icon: '💆' },
            { id: 'lotion', name: 'Lotion', icon: '🧴' },
            { id: 'towels', name: 'Towels', icon: '🧣' },
            { id: 'tissue-paper', name: 'Tissue paper', icon: '📄' },
            { id: 'sanitary-pads', name: 'Sanitary pads', icon: '❤️' },
            { id: 'panty-liners', name: 'Panty liners', icon: '❤️' },
            { id: 'socks', name: 'Socks', icon: '🧦' }
        ]
    },
    dormEssentials: {
        id: 'dormEssentials',
        name: 'Dorm Essentials',
        displayName: 'Dorm & Room Essentials',
        icon: '🛏️',
        color: '#1abc9c',
        bgColor: '#E8F8F5',
        subcategories: [
            { id: 'bedsheets', name: 'Bedsheets', icon: '🛏️' },
            { id: 'blankets', name: 'Blankets', icon: '🛌' },
            { id: 'hangers', name: 'Hangers', icon: '👕' },
            { id: 'broom', name: 'Broom', icon: '🧹' },
            { id: 'detergent', name: 'Detergent', icon: '🧺' }
        ]
    },
    health: {
        id: 'health',
        name: 'Health & Medical',
        displayName: 'Health & Medical',
        icon: '🏥',
        color: '#2ecc71',
        bgColor: '#E9F7EF',
        subcategories: [
            { id: 'face-masks', name: 'Face masks', icon: '😷' },
            { id: 'first-aid-kits', name: 'First aid kits', icon: '🩹' },
            { id: 'hand-sanitizer', name: 'Hand sanitizer', icon: '🧴' }
        ]
    }
};

export const getCategoryById = (id) => {
    return PRODUCT_CATEGORIES[id] || null;
};

export const getAllCategories = () => {
    return Object.values(PRODUCT_CATEGORIES);
};

export const getSubcategories = (categoryId) => {
    return PRODUCT_CATEGORIES[categoryId]?.subcategories || [];
};

export const getCategoryIcon = (categoryId) => {
    return PRODUCT_CATEGORIES[categoryId]?.icon || '📦';
};

export const getCategoryColor = (categoryId) => {
    return PRODUCT_CATEGORIES[categoryId]?.color || '#666';
};

export default PRODUCT_CATEGORIES;