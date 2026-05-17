require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Vendor = require('./models/Vendor');

const products = [
    // ========== ELECTRONICS ==========
    {
        name: "Fast Phone Charger",
        description: "Quick charge 20W USB-C charger for phones",
        category: "electronics",
        subcategory: "phone-chargers",
        price: 550,
        imageUrl: "https://www.bing.com/aclick?ld=e8YaWy24WM890qnFFtyB3hbTVUCUxMTvXfhGYVLTa2tMX_8kwIsB1_qR0y7nwRpeUVNsUTLmNRwHnObVAtAYwjdK7kMANwt-EbXu6wCSapuFqPYWcdg_CVkjiEMRGHQ904Aa5CU3El-oJV0F9Wdq2NjXH19mFz1scUQfYPnzXsX9LSCTn7YSGQdhlWRkp14i2Xi-51Pm6ZyWqcPL7FMVoMWq6Xzp0&u=aHR0cHMlM2ElMmYlMmZ3d3cubWFkZS1pbi1jaGluYS5jb20lMmZwcmljZSUyZnByb2RldGFpbF9DYXItRWxlY3Ryb25pY3NfcUd3UmxDcFlMWGNkLmh0bWwlM2Z1dG1fc291cmNlJTNkYmluZyUyNnV0bV9tZWRpdW0lM2RjcGMlMjZ1dG1fY29udGVudCUzZFg3ODY5ODM1JTI2dXRtX2NhbXBhaWduJTNkNDU4NDczMTEzJTI2YWRncm91cCUzZDExODc0NzQ1NDgwMzAxNzQlMjZ1dG1fdGVybSUzZCUyNm10cCUzZGJlJTI2bmV0JTNkbyUyNmRldiUzZGMlMjZsb2MlM2QyMjg4MDYtJTI2bXNjbGtpZCUzZGU0NWU1ODc2NGNmMjE4NjM2NGY0MzI3MTNjOTMzZDM5&rlid=e45e58764cf2186364f432713c933d39&ntb=1",
        stock: 50,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Wireless Earphones",
        description: "Bluetooth 5.0 earphones with charging case",
        category: "electronics",
        subcategory: "earphones",
        price: 1000,
        imageUrl: "https://th.bing.com/th/id/OIP.WhyZrBmnTqiRSQy72Rd8NQHaGz?w=150&h=150&c=6&r=0&o=7&pid=1.7&rm=3",
        stock: 30,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "USB-C Cable",
        description: "Fast charging USB-C to USB-C cable, 1m",
        category: "electronics",
        subcategory: "usb-cables",
        price: 350,
        imageUrl: "https://th.bing.com/th/id/OIP.fVgh3ahibHIu0c9u9nbIiwHaHa?w=184&h=184&c=7&r=0&o=7&pid=1.7&rm=3",
        stock: 100,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Power Bank 10000mAh",
        description: "Portable charger with dual USB ports",
        category: "electronics",
        subcategory: "power-banks",
        price: 2050,
        imageUrl: "https://tse1.mm.bing.net/th/id/OIP.HR36N5fk0Nxoy6L0txNUSAHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        stock: 40,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Wireless Mouse",
        description: "Ergonomic wireless mouse for laptop",
        category: "electronics",
        subcategory: "mouse",
        price: 750,
        imageUrl: "https://tse1.mm.bing.net/th/id/OIP.v4BnHzz5yMA83NNSp2rj0wHaFb?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        stock: 60,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "32GB USB Flash Drive",
        description: "USB 3.0 flash drive for file storage",
        category: "electronics",
        subcategory: "flash-drives",
        price: 380,
        imageUrl: "https://tse2.mm.bing.net/th/id/OIP.n8TvrNY9QXky6KWS67Lw9QHaE7?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        stock: 80,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Silicone Phone Case",
        description: "Protective case for iPhone/Samsung",
        category: "electronics",
        subcategory: "phone-cases",
        price: 120,
        imageUrl: "data:image/webp;base64,UklGRlgFAABXRUJQVlA4IEwFAACQFgCdASpZAFoAPp1EnUolo6KhpzQM2LATiUG5ALRlg+1QE35n0gbZ3nev9l02/Uh+gB0wE+O+qa4G3z2EyvgfHIvVT/MvOL6y3ez/fd8n6Df60nqSN0W7aHcJ/R+v/WPeT8htW6RalykssBzgkDOuVnj1f34kU72c3jAJsADuQr3SDk3flt3qTLLAcYmmK+uOYtgY1AXKuSfGutpvY9f+mC7brpZExEa047FEAXExw15Tmjz5mpXTl7rEnEAA/vq3EZ6lpUoz22qStJB18RfTbEpBh9/Vfvjh1uJde4MYbMcLCLaifc8eMgt+hGcnHN8FjRSOfyJ7ogPl0dN9MDFvv36U8GBM1AP5XZ2mFkU1d+JQeOfOq7DnKCnD+HROLxeOxvVyJq/qi0upCCSVym3bb9jOY9VjLxaG31qTvdqDTH9NXJPrYiFDu2dY1i9TtgG0YX+Bwojfy30f7ea4ajsIcs0mchEB7yjPdmdO1b8h3wvfiFbd/+cBrYm6HhJeLuB3nlsgbZHs1p2/s+chItxsfeYeN2oED+einOTd8GI2aHVvhGFIww+n39tcX6f4IeVIjk59f71+wGzeOA5Wkig/0guhYKROR6WoIEH87msaKbDGBQhzYWP+BBqs+ZMs2XLZryBXbmJ3V1gmpQE9QRzBqhG/nkOk28Welv/9+zzeilhFpS3NfZzZma3tISKp89eP1JxWuJonjQ7EfALrrk7NEpW8rW8pATLkDlknkW59TD4bKbKBSuASWQW2y1PQQGGwkP1Hnk3/bI7iU1ympIYp/SkFtKfPBYBHjLZt61Wxg+Ir77IpPU7Rbou1ChJJkXvviVkTkSGZ7hoDFTbwYDd9UZNnvmAXcr89l+J+ZfMLL/xV/9L9pYT182mglEaZdmHXiR4lN+QJyyxswgyBdnu3UTZ/rsbpS5AW0N3YeZhrLdVo2A3ysrAzWCGAQoT1+o7DMK/8dNwx2fUKPg+kWZdE8xBJa87npQN/hmTciwcAFPxEN45XsT7RckT5bDHd9Kf6cPf6zsDKzL6QYyqO4D/IxvkeDWY0qUlqYZwZOrEecp2CsI6lkQsXkZp4TyOWrHWTI7c91zHyEGwuEQ39A2EQQDTK8QKTGyLRVbCMRXXqWf8hD+BmTxi2MOVL8B3zmXMYrj9EgNOO+6y9sKQ/IdT1A52SUmFR41d8BhU6mrsN6HOqHKpGU2KwxAekMEcEHrYNePHK+lvt3H7o/IMwEOQCI+KFLCVzfhA/6su6bXILwlTEa8rAeq/NTkY+lMYhMYxamV3eQQ7T5zfpi/xXAqv8zm/YfIPRMyXsf+5SdwqeIwjZF6Gf7EFGF8WmE3qxBF4MIKBHxJKbc/ePuWP52lfY/5EZ1v2FRpHLUWolkZeVeT5c+iRa8WL5+6FaPWhzVWV0enFOPnuYhzeAYNME+nfy1iE2sqz09UJzK45Cw5t6ou2rioAzakY2MwSYO2jRwB9XASxaQGlvmp/X8IhjlhGyNhP5sIqEhnWMuzeZYpl02VKAWqWHPe+ZRszKWsYE0cnSybGpsg5vzYyT+71nub5rUTNZZkC4a0XWusw9NY/ZZ/nif4sqafvEwqCdFYUMloiRtRkU930HjES3n1qmcuvRYa2quvOpm8ossd/lWcf/PyddIB3jt0f0ZiAV0S/ha35slAgVsg6RVJozAND8cvPl8tOmdiocPYThmEG+qGgSAeAem9M4wvYfxa+gNjlFfO2j5liNdLr5+5ygO1YwavjT2j/mZ66D8+alawlAP6kDflakfWe7XGN0IvE0JM0jSlwYnOg/eK4/o9KwAAA=",
        stock: 70,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },

    // ========== STATIONERY ==========
    {
        name: "Ballpoint Pen Pack",
        description: "Pack of 10 blue ink pens",
        category: "stationery",
        subcategory: "pens",
        price: 50,
        imageUrl: "https://th.bing.com/th/id/OIP.cDIgcyzbhAu-mfhbNs2jugHaG1?w=223&h=206&c=7&r=0&o=7&pid=1.7&rm=3",
        stock: 200,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "HB Pencils Pack",
        description: "Pack of 12 HB pencils with eraser",
        category: "stationery",
        subcategory: "pencils",
        price: 40,
        imageUrl: "https://cdn-prd-02.pnp.co.za/sys-master/images/hc7/hd1/10976826228766/silo-product-image-v2-11Oct2022-180137-4007817186046-Angle_A-62102-4027_400Wx400H",
        stock: 150,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "A5 Spiral Notebook",
        description: "100 pages ruled notebook",
        category: "stationery",
        subcategory: "notebooks",
        price: 260,
        imageUrl: "https://image.made-in-china.com/202f0j00inkvWGwdPmbI/Wholesale-Custom-Business-School-Planner-A5-PU-Leather-Thermal-Binding-Diary-Notebook.webp",
        stock: 120,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Engineering Mathematics Textbook",
        description: "Complete guide for engineering students",
        category: "stationery",
        subcategory: "textbooks",
        price: 550,
        imageUrl: "https://th.bing.com/th/id/OIP.hQ0dtJg7nbIGesyzPbQh-gHaJ4?w=184&h=245&c=7&r=0&o=7&pid=1.7&rm=3",
        stock: 30,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Sticky Notes Pad",
        description: "3x3 inch sticky notes, 100 sheets",
        category: "stationery",
        subcategory: "sticky-notes",
        price: 135,
        imageUrl: "https://image.made-in-china.com/202f0j00TuCqKcysrSrL/High-Quality-Animal-Shape-Sticky-Memo-Pad.webp",
        stock: 100,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Highlighter Set",
        description: "Set of 4 fluorescent highlighters",
        category: "stationery",
        subcategory: "highlighters",
        price: 145,
        imageUrl: "https://static2.jetpens.com/images/a/000/106/106715.jpg?q=90&s=48bab3f5a56e25fdcd123be928fe24b4",
        stock: 80,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Expanding File Folder",
        description: "13 pocket expanding file organizer",
        category: "stationery",
        subcategory: "files-folders",
        price: 190,
        imageUrl: "https://th.bing.com/th/id/OIP.hr4hA--BFeaL4CvUF9z25AHaHa?w=198&h=198&c=7&r=0&o=7&pid=1.7&rm=3",
        stock: 60,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Scientific Calculator",
        description: "FX-991ES plus scientific calculator",
        category: "stationery",
        subcategory: "calculators",
        price: 450,
        imageUrl: "https://th.bing.com/th/id/OIP.XgLS-gZ8qy95BoLF4GfwaAHaHa?w=175&h=180&c=7&r=0&o=7&pid=1.7&rm=3",
        stock: 40,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Geometry Box",
        description: "Compass, ruler, protractor set",
        category: "stationery",
        subcategory: "geometry-sets",
        price: 180,
        imageUrl: "https://tse2.mm.bing.net/th/id/OIP.jH6wbFv0e6TAGNLPFre7FgHaHk?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        stock: 70,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },

    // ========== FOOD & SNACKS ==========
    {
        name: "Lays Potato Chips",
        description: "Classic salted, 50g pack",
        category: "food",
        subcategory: "chips",
        price: 55,
        imageUrl: "https://th.bing.com/th/id/R.b0c5207fdcc6536d4475504187fa3bdc?rik=zj9NsdqNOZ7e4w&riu=http%3a%2f%2frecipe-graphics.grocerywebsite.com%2f0_GraphicsRecipes%2f7977_4k.jpg&ehk=Pi8znWV5W3xj2s5d8Y3Vn7rZ4GQWsJpu8tBroCcyA7w%3d&risl=&pid=ImgRaw&r=0",
        stock: 100,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Oreo Biscuits",
        description: "Chocolate sandwich cookies, 80g",
        category: "food",
        subcategory: "biscuits",
        price: 115,
        imageUrl: "https://tse2.mm.bing.net/th/id/OIP.eAQ5mqrI8TuEvtk-4knZ3AHaEO?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        stock: 150,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Instant Cup Noodles",
        description: "Chicken flavor instant noodles",
        category: "food",
        subcategory: "instant-noodles",
        price: 220,
        imageUrl: "https://m.media-amazon.com/images/I/81sX1TP9kLL._SL1500_.jpg",
        stock: 200,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Snickers Bar",
        description: "Peanut, caramel, nougat, 50g",
        category: "food",
        subcategory: "chocolates",
        price: 50,
        imageUrl: "https://www.snickers.co.uk/sites/g/files/fnmzdf751/files/migrate-product-files/xfjmorcx0s9wo5pz4hn1.png",
        stock: 80,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Coca Cola",
        description: "Classic soda, 330ml can",
        category: "food",
        subcategory: "soft-drinks",
        price: 60,
        imageUrl:"https://i.pinimg.com/originals/1e/80/90/1e80907526bf96fff3946ce4d78aa5e9.jpg",
        stock: 200,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Mineral Water",
        description: "500ml bottled water",
        category: "food",
        subcategory: "water-bottles",
        price: 30,
        imageUrl: "https://thumbs.dreamstime.com/b/natural-mineral-water-bottle-drinking-spring-67002932.jpg",
        stock: 300,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Instant Coffee",
        description: "3-in-1 coffee sachets, pack of 10",
        category: "food",
        subcategory: "coffee",
        price: 70,
        imageUrl: "data:image/webp;base64,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",
        stock: 100,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Red Bull Energy Drink",
        description: "250ml energy drink",
        category: "food",
        subcategory: "energy-drinks",
        price: 50,
        imageUrl: "data:image/webp;base64,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",
        stock: 60,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },

    // ========== PERSONAL CARE ==========
    {
        name: "Colgate Toothpaste",
        description: "100g fluoride toothpaste",
        category: "personalCare",
        subcategory: "toothpaste",
        price: 145,
        imageUrl: "https://thumbs.dreamstime.com/z/composition-colgate-toothpastes-poznan-pol-jul-colgate-toothpastes-brand-oral-hygiene-products-manufactured-american-286954218.jpg",
        stock: 80,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Soft Toothbrush",
        description: "Medium bristle toothbrush",
        category: "personalCare",
        subcategory: "toothbrush",
        price: 110,
        imageUrl: "https://www.kitchenerdentistlancaster.com/wp-content/uploads/2017/05/Electric-Toothbrushes-vs-Manual-Toothbrushes-Lancaster-Dental-Your-Kitchener-Dentist.jpg",
        stock: 100,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Dove Soap",
        description: "75g moisturizing soap bar",
        category: "personalCare",
        subcategory: "soap",
        price: 65,
        imageUrl: "https://m.media-amazon.com/images/I/81xEgjEmPML.jpg",
        stock: 120,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Shampoo Sachet",
        description: "Sun silk shampoo, 10ml sachet",
        category: "personalCare",
        subcategory: "shampoo",
        price: 15,
        imageUrl: "https://th.bing.com/th/id/R.8c1066fe4a47ac12486165fdff73f7ab?rik=WmuAw3w7%2flxczQ&riu=http%3a%2f%2fwww.allpackchina.com%2fwp-content%2fuploads%2f2024%2f01%2fSachets.jpg&ehk=YY2ec31mLjiZeCI3pXKULuOO8v9QT1XvjlSFDcU2OEk%3d&risl=&pid=ImgRaw&r=0",
        stock: 200,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Body Lotion",
        description: "50ml moisturizing lotion",
        category: "personalCare",
        subcategory: "lotion",
        price: 55,
        imageUrl: "https://media.allure.com/photos/62797d941ff5de4a97e2e214/16:9/w_2580,c_limit/5-08%20best%20body%20lotions.jpg?mbid=social_retweet",
        stock: 60,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Face Towel",
        description: "Soft cotton face towel",
        category: "personalCare",
        subcategory: "towels",
        price: 70,
        imageUrl: "https://www.gosupps.com/media/catalog/product/cache/25/image/1500x/040ec09b1e35df139433887a97daa66f/7/1/71Pfv7sMwuS._AC_SL1500_.jpg",
        stock: 50,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Tissue Paper",
        description: "Pack of 10 tissue papers",
        category: "personalCare",
        subcategory: "tissue-paper",
        price: 30,
        imageUrl: "https://tse4.mm.bing.net/th/id/OIP.dBuTkSnO53l7UEr7UnZJogHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        stock: 150,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Sanitary Pads",
        description: "Pack of 10 sanitary pads",
        category: "personalCare",
        subcategory: "sanitary-pads",
        price: 60,
        imageUrl: "https://kasha-assets-production.s3.amazonaws.com/rw/uploads/2017/11/DSC_6966-1.jpg",
        stock: 100,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Cotton Socks",
        description: "Pair of cotton casual socks",
        category: "personalCare",
        subcategory: "socks",
        price: 40,
        imageUrl: "https://i.etsystatic.com/38045112/r/il/21e588/4270502099/il_800x800.4270502099_m8aq.jpg",
        stock: 80,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },

    // ========== DORM ESSENTIALS ==========
    {
        name: "Single Bedsheet",
        description: "Cotton bedsheet for single bed",
        category: "dormEssentials",
        subcategory: "bedsheets",
        price: 250,
        imageUrl: "https://tse1.mm.bing.net/th/id/OIP.YgW1zxmSkla272ruDXI1SAHaIb?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        stock: 40,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Warm Blanket",
        description: "Fleece blanket for cold nights",
        category: "dormEssentials",
        subcategory: "blankets",
        price: 750,
        imageUrl: "https://shinysofas.co.uk/cdn/shop/files/Purple_9d4512b4-f1af-4e78-bf0a-ac93f6a123e2_530x@2x.png?v=1695301233",
        stock: 30,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Clothes Hangers",
        description: "Pack of 10 plastic hangers",
        category: "dormEssentials",
        subcategory: "hangers",
        price: 40,
        imageUrl: "https://tse1.mm.bing.net/th/id/OIP.IYI7WOeyQOkjXy5Hj0XizAHaE9?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        stock: 100,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Broom and Dustpan",
        description: "Dorm cleaning set",
        category: "dormEssentials",
        subcategory: "broom",
        price: 120,
        imageUrl: "https://i5.walmartimages.com/seo/Broom-Dustpan-Dustpan-Combo-Set-Long-Handle-Set-Home-Lobby-Office-Comb-Indoor-Out_0e2d8e8f-2e57-4b07-ad6e-ee42ea8062e9.059abfd2ede88bae1934018c650fe5c4.jpeg",
        stock: 40,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Laundry Detergent",
        description: "500g washing powder",
        category: "dormEssentials",
        subcategory: "detergent",
        price: 80,
        imageUrl: "https://m.media-amazon.com/images/I/41IAz50STSL._AC_.jpg",
        stock: 60,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },

    // ========== HEALTH & MEDICAL ==========
    {
        name: "Disposable Face Mask",
        description: "Pack of 10 disposable masks",
        category: "health",
        subcategory: "face-masks",
        price: 40,
        imageUrl: "https://media.bizj.us/view/img/11844047/818-face-mask*1200xx1200-675-0-0.jpg",
        stock: 200,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "First Aid Kit",
        description: "Compact first aid kit for emergencies",
        category: "health",
        subcategory: "first-aid-kits",
        price: 180,
        imageUrl: "https://tse4.mm.bing.net/th/id/OIP.iGSAfpKu3LVIjktvEDvxWQHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        stock: 30,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    },
    {
        name: "Hand Sanitizer",
        description: "50ml alcohol-based sanitizer",
        category: "health",
        subcategory: "hand-sanitizer",
        price: 35,
        imageUrl: "https://www.cdc.gov/clean-hands/media/images/2024/04/Untitled-design-31.png",
        stock: 150,
        availableCampuses: ["4kilo", "5kilo", "6kilo"]
    }
];

async function seedProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');
        
        const vendor = await Vendor.findOne();
        if (!vendor) {
            console.log('❌ No vendor found. Please create a vendor first.');
            process.exit(1);
        }
        
        console.log(`📦 Using vendor: ${vendor.businessName}`);
        
        // Clear existing products
        await Product.deleteMany();
        console.log('🗑️ Cleared existing products');
        
        // Add products with vendor ID
        const productsWithVendor = products.map(p => ({
            ...p,
            vendor: vendor._id
        }));
        
        const result = await Product.insertMany(productsWithVendor);
        console.log(`✅ Added ${result.length} products!`);
        
        // Group by category
        const byCategory = result.reduce((acc, p) => {
            acc[p.category] = (acc[p.category] || 0) + 1;
            return acc;
        }, {});
        
        console.log('\n📊 Products by category:');
        Object.entries(byCategory).forEach(([category, count]) => {
            console.log(`   - ${category}: ${count} products`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

seedProducts();