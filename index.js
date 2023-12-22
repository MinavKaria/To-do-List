//Local Server
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

db.connect((err) => {
  if (err) {
    console.error('connection error', err.stack);
  } else {
    console.log('Connected to the database');
    db.query(`
      CREATE TABLE IF NOT EXISTS todo (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        todo_date TIMESTAMP NOT NULL
      );
    `, (err, res) => {
      if (err) {
        console.error('error creating table', err.stack);
      } else {
        console.log('Table created or already exists');
      }
    });
  }
});

let items = [];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function getItems() {
  const qry="SELECT * FROM todo order by id asc";
  const result = await db.query(qry);
  console.log(result.rows);

  items = result.rows;
}

app.get("/", async (req, res) => {
  await getItems();
  console.log(items);
  res.render("index.ejs", 
  {
    listTitle: "Today",
    listItems: items,
    placeholder: "New Item",
  });
});

app.post("/add", async (req, res) => 
{
  const item = req.body.newItem;
  console.log(item);
  const date=new Date();
  const qry="INSERT INTO todo (title,todo_date) VALUES ($1,$2)";
  const values=[item,date];

  if(item === "")
  {
    await getItems();
    
    res.render("index.ejs", 
    {
      listTitle: "Today",
      listItems: items,
      placeholder: "Item cannot be empty",
    });

  }
  else
  {
    db.query(qry,values);
    res.redirect("/");
  }
});

app.post("/edit", async (req, res) => {
  const updatedItem = req.body.updatedItemTitle;
  console.log(updatedItem);
  const updatedItemID = req.body.updatedItemID;
  console.log(updatedItemID);

  const qry="UPDATE todo SET title=$1 WHERE id=$2";
  const values=[updatedItem,updatedItemID];

  await db.query(qry,values);

  getItems();

  res.redirect("/");
});

app.post("/delete", (req, res) => {
  const checkedItemID = req.body.deleteItemId;
  console.log(checkedItemID);

  const qry="DELETE FROM todo WHERE id=$1";
  const values=[checkedItemID];

  db.query(qry,values);



  res.redirect("/");


});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
