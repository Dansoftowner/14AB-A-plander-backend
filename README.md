# Plander Backend

A plander alkalmazás backend-je.  

A [Plander dokumentáció itt érhető el.](https://github.com/Dansoftowner/14AB-A-plander-docs)


## 🔨 Build

### Development server indítása
```
npm run dev
```

### "Hagyományos" futtatás

#### Typescript kód fordítása

```
npm run build
```

#### Lefordított kód futtatása

```
npm run start
```

### Tesztek futtatása

A tesztek futtatása előtt fontos, hogy fusson egy lokális mongodb szerver.
A MongoDB Community Server letőlthető [itt](https://www.mongodb.com/try/download/community). 


```
npm run test
```

Monitorozással:
```
npm run test:watch
```

Lefedettség számítással (coverage):

```
npm run test:coverage
```

### 🏋️ Függőségek

A használt "third-party" szoftverek az [ACKNOWLEDGEMENTS.md](ACKNOWLEDGEMENTS.md) állományban vannak listázva.