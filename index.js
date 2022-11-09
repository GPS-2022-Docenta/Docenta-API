const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const https = require("https");
const fs = require("fs");
const path = require("path");

const salt = bcrypt.genSaltSync(10);

const PORT = process.env.PORT || 3050;

const app = express();

app.use(
  cors({
    origin: "https://docenta.vercel.app",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT"],
  })
);
app.use(bodyParser.json());

// MySQL
const connection = mysql.createConnection({
  host: "docenta-db.cgwfgkytvfiu.us-east-1.rds.amazonaws.com",
  user: "admin",
  password: "huszak99borque00bernal00",
  database: "docenta",
});

// Página de inicio
app.get("/", (req, res) => {
  res.send("Docenta API running!");
});

// USER REQUESTS
// Obtener todos los usuarios
app.get("/users", (req, res) => {
  const getUsersSQL = "SELECT * FROM Usuario";

  connection.query(getUsersSQL, (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      res.status(200).json(results);
    } else {
      res.status(404).send("Vaya... el contenido que buscas no existe.");
    }
  });
});

// Obtener usuario por nickName
app.get("/users/:nickName", (req, res) => {
  const { nickName } = req.params;

  const getOneUserSQL = `SELECT * FROM Usuario WHERE nickName = "${nickName}"`;

  connection.query(getOneUserSQL, (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      res.status(200).json(result);
    } else {
      res.status(404).send("Usuario no encontrado...");
    }
  });
});

// Registrar
app.post("/register", (req, res) => {
  const usuarioObj = {
    nickName: req.body.nickName,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    birthday: req.body.birthday,
    country: req.body.country,
    phone: req.body.phone,
    gender: req.body.gender,
  };

  const registerSQL = "INSERT INTO Usuario SET ?";
  const checkUserSQL =
    "SELECT * FROM Usuario WHERE nickName = '" + usuarioObj.nickName + "'";

  connection.query(checkUserSQL, (error, result) => {
    if (error) throw error;
    if (result.length > 0) {
      res.sendStatus(409);
    } else {
      let hash = bcrypt.hashSync(usuarioObj.password, salt);
      usuarioObj.password = hash;
      connection.query(registerSQL, usuarioObj, (error) => {
        if (error) throw error;
        res.sendStatus(201);
      });
    }
  });
});

// Iniciar sesión
app.post("/login", (req, res) => {
  const usuarioObj = {
    nickName: req.body.nickName,
    password: req.body.password,
  };

  const loginSQL =
    "SELECT * FROM Usuario WHERE nickName = '" + usuarioObj.nickName + "'";

  connection.query(loginSQL, (error, result) => {
    if (error) throw error;
    if (result.length == 0) {
      res.status(404).json({
        response: "Usuario no encontrado...",
      });
    } else {
      if (bcrypt.compareSync(usuarioObj.password, result[0].password)) {
        res.sendStatus(200);
      } else {
        res.sendStatus(401);
      }
    }
  });
});

//Actualizar perfil
app.put("/updateUser/:nickName", (req, res) => {
  const { nickName } = req.params;

  const usuarioObj = {
    nickName: req.body.nickName,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    birthday: req.body.birthday,
    country: req.body.country,
    phone: req.body.phone,
    gender: req.body.gender,
  };

  const updateSQL = "UPDATE Usuario SET ?";
  const checkUserSQL = `SELECT * FROM Usuario WHERE nickName = "${nickName}"`;

  connection.query(checkUserSQL, (error, result) => {
    if (error) throw error;
    if (result.length == 0) {
      res.status(404).json({
        response: "Usuario no encontrado...",
      });
    } else {
      if (bcrypt.compareSync(usuarioObj.password, result[0].password)) {
        res.status(304);
        usuarioObj.password = result[0].password;
      } else {
        let hash = bcrypt.hashSync(usuarioObj.password, salt);
        usuarioObj.password = hash;
      }
      connection.query(updateSQL, usuarioObj, (error) => {
        if (error) throw error;
        res.sendStatus(202);
      });
    }
  });
});

// ADMIN REQUESTS
// Eliminar usuario
app.delete("/deleteUser/:nickName", (req, res) => {
  const { nickName } = req.params;

  const checkUserSQL = `SELECT * FROM Usuario WHERE nickName = "${nickName}"`;
  const deleteSQL = `DELETE FROM Usuario WHERE nickName = "${nickName}"`;

  connection.query(checkUserSQL, (error, result) => {
    if (error) throw error;
    if (result.length > 0) {
      connection.query(deleteSQL, (error) => {
        if (error) throw error;
        res.status(200).send("¡Usuario eliminado correctamente!");
      });
    } else {
      res.status(404).json({
        response: "Usuario no encontrado...",
      });
    }
  });
});

// Obtener todos los cursos
app.get("/cursos", (req, res) => {
  const getCursosSQL = "SELECT * FROM Cursos ORDER BY id ASC";

  connection.query(getCursosSQL, (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      res.status(200).json(results);
    } else {
      res.status(404).send("Vaya... el contenido que buscas no existe.");
    }
  });
});

// Obtener cursos para un usuario con nickName determinado --> NO FUNCIONA POR EL NICKNAME...
app.get("/cursos/:nickName", (req, res) => {
  const { nick } = req.params;

  const getOneCursoSQL = `SELECT * FROM Cursos WHERE nickName = "${nick}"`;

  connection.query(getOneCursoSQL, (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      res.status(200).json(result);
    } else {
      res.status(404).send("Contenido no encontrado...");
    }
  });
});

// Obtener un curso concreto (por su nombre) de los cursos del usuario --> NO FUNCIONA POR EL NICKNAME...
app.get("/cursos/:nick/:nombreCurso", (req, res) => {
  const { nick } = req.params;
  const { nombreCurso } = req.params;

  const getCursoSQL = `SELECT * FROM Cursos WHERE nombre = "${nombreCurso}" AND nickName = "${nick}"`;

  connection.query(getCursoSQL, (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      res.status(200).json(result);
    } else {
      res.status(404).send("Contenido no encontrado...");
    }
  });
});

// Añadir curso
app.post("/addCurso", (req, res) => {
  const addCursoObj = {
    id: req.body.id,
    nombre: req.body.nombre,
    categoria: req.body.categoria,
    descripcion: req.body.descripcion,
    imagen: req.body.imagen,
    enlace: req.body.enlace,
    autor: req.body.autor,
    nickName: req.body.nickName,
  };

  const checkCursoSQL =
    "SELECT * FROM Cursos WHERE id = '" +
    addCursoObj.id +
    "' AND nombre = '" +
    addCursoObj.nombre +
    "' AND categoria = '" +
    addCursoObj.categoria +
    "' AND descripcion = '" +
    addCursoObj.descripcion +
    "' AND imagen = '" +
    addCursoObj.imagen +
    "' AND enlace = '" +
    addCursoObj.enlace +
    "' AND autor = '" +
    addCursoObj.autor +
    "' AND nickName = '" +
    addCursoObj.nickName +
    "'";
  const addCursoSQL = "INSERT INTO Cursos SET ?";

  connection.query(checkCursoSQL, (error, result) => {
    if (error) throw error;
    if (result.length > 0) {
      res.sendStatus(409);
    } else {
      connection.query(addCursoSQL, addCursoObj, (error) => {
        if (error) throw error;
        res.sendStatus(201);
      });
    }
  });
});

// Eliminar curso de usuario
app.delete("/delCurso/:nick/:nombreCurso", (req, res) => {
  const { nick } = req.params;
  const { nombreCurso } = req.params;

  const checkCursoSQL = `SELECT * FROM Cursos WHERE nombre = "${nombreCurso}" AND nickName = "${nick}"`;
  const delCursoSQL = `DELETE FROM Cursos WHERE nombre = "${nombreCurso}" AND nickName = "${nick}"`;

  connection.query(checkCursoSQL, (error, result) => {
    if (error) throw error;
    if (result.length > 0) {
      connection.query(delCursoSQL, (error) => {
        if (error) throw error;
        res.status(200).send("¡Curso eliminado correctamente!");
      });
    } else {
      res.status(404).json({
        response: "Curso no encontrado...",
      });
    }
  });
});

// Check connection
connection.connect((error) => {
  if (error) throw error;
  console.log("Database server running!");
});

const sslServer = https.createServer(
  {
    key: fs.readFileSync(path.resolve("./security/key.pem")),
    cert: fs.readFileSync(path.resolve("./security/cert.pem")),
  },
  app
);

sslServer.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

// Export the Express API
module.exports = app;
