function print(id, message) {
    document.getElementById(id).textContent = message;
}

/* 1️⃣ Primitive vs Object */
function compareTypes() {
    let a = 10;
    let b = a;
    b = 20;

    let obj1 = { value: 10 };
    let obj2 = obj1;
    obj2.value = 50;

    print("primitiveOutput",
`Primitive:
a = ${a}, b = ${b}

Object:
obj1.value = ${obj1.value}
obj2.value = ${obj2.value}`);
}

/* 2️⃣ Methods */
function runMethods() {
    const user = {
        name: "Akhil",
        greet() {
            return "Hello, " + this.name;
        }
    };

    print("methodOutput", user.greet());
}

/* 3️⃣ Freeze & Seal */
function freezeSealDemo() {
    const obj = { name: "JS" };
    Object.freeze(obj);
    obj.name = "Changed";

    print("freezeOutput",
`Frozen Object:
${JSON.stringify(obj)}
(Cannot modify)`);

}

/* 4️⃣ Keys Values Entries */
function keyValueDemo() {
    const user = { name: "Akhil", age: 22 };
    print("keysOutput",
`Keys: ${Object.keys(user)}
Values: ${Object.values(user)}
Entries: ${JSON.stringify(Object.entries(user))}`);
}

/* 5️⃣ Constructor */
function constructorDemo() {
    function Person(name, age) {
        this.name = name;
        this.age = age;
    }

    const p1 = new Person("Akhil", 22);

    print("constructorOutput",
`Name: ${p1.name}
Age: ${p1.age}`);
}

/* 6️⃣ Class */
function classDemo() {
    class Animal {
        constructor(name) {
            this.name = name;
        }
        speak() {
            return `${this.name} makes a sound`;
        }
    }

    const dog = new Animal("Dog");

    print("classOutput", dog.speak());
}

/* 7️⃣ Getters & Setters */
function getterSetterDemo() {
    const user = {
        firstName: "Akhil",
        lastName: "Steven",
        get fullName() {
            return `${this.firstName} ${this.lastName}`;
        }
    };

    print("getterOutput", user.fullName);
}

/* 8️⃣ For...in */
function iterationDemo() {
    const obj = { a: 1, b: 2, c: 3 };
    let result = "";

    for (let key in obj) {
        result += `${key}: ${obj[key]}\n`;
    }

    print("iterationOutput", result);
}