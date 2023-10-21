const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const pathDb = path.join(__dirname, "todoApplication.db");
app.use(express.json());
let db = null;

const initializeDbToServer = async () => {
  try {
    db = await open({
      filename: pathDb,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Db error ${error.message}`);
    process.exit(1);
  }
};

initializeDbToServer();

// Get Method - status: ToDo
app.get("/todos/", async (request, response) => {
  let dbResponse = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;
  console.log(status);
  switch (true) {
    case request.query.status != undefined &&
      request.query.priority != undefined:
      getTodoQuery = `
          SELECT
            *
          FROM 
            todo
          WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND priority = '${priority}';`;
      break;
    case request.query.priority != undefined:
      getTodoQuery = `
          SELECT
            *
          FROM
            todo
          WHERE
            todo LIKE '%${search_q}%'
            AND priority = '${priority}';`;
      break;
    case request.query.status != undefined:
      getTodoQuery = `
          SELECT
            *
          FROM
            todo
          WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}';`;
      break;
    default:
      getTodoQuery = `
          SELECT
            *
          FROM
            todo
          WHERE
            todo LIKE '%${search_q}%';`;
      break;
  }
  dbResponse = await db.all(getTodoQuery);
  response.send(dbResponse);
});

// Get Method - a specific todo
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const reqQuery = `
  SELECT 
    *
  FROM
    todo
  WHERE 
    id = ${todoId};`;
  const dbResponse = await db.get(reqQuery);
  response.send(dbResponse);
});

// Post Method
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const reqQuery = `
    INSERT INTO todo (id, todo, priority, status)
    VALUES ( ${id}, '${todo}', '${priority}', '${status}' );`;
  await db.run(reqQuery);
  response.send("Todo Successfully Added");
});

// Put method
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updatedColumn = "";
  switch (true) {
    case request.body.status != undefined:
      updatedColumn = "Status";
      break;
    case request.body.priority != undefined:
      updatedColumn = "Priority";
      break;
    default:
      updatedColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
  SELECT
    *
  FROM
    todo
  WHERE
    id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateQuery = `
  UPDATE
    todo
  SET 
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
  WHERE
    id = ${todoId};`;

  await db.run(updateQuery);
  response.send(`${updatedColumn} Updated`);
});

// Delete Method
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM 
        todo
    WHERE
        id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});
module.exports = app;
