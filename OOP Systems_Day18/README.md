#  Digital Pet Simulator – AAA Edition

A visually immersive, object-oriented Digital Pet Simulator built using ES6 Class syntax.

This project demonstrates strong OOP principles, state management, and modern UI/UX design with cinematic animations.

---

##  Learning Objectives Achieved

-Use ES6 Class syntax
-Manage object state with properties
-Implement methods to update state
- Use Getters/Setters for validation
- Maintain controlled state updates

---

## 🏗 System Design

### Pet Class Properties

- `name`
- `type`
- `_health`
- `hunger`
- `energy`
- `xp`
- `level`

---

### Implemented Methods

- `feed()`
- `play()`
- `rest()`
- `normalize()`
- `gainXP()`
- `getStatus()`

---

### Getter & Setter

Health is strictly controlled between 0–100 using:

```javascript
get health()
set health(value)