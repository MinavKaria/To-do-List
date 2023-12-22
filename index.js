//Vercel Server
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import ejs from "ejs";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';


const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const port = 3000;

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL + "?sslmode=require",
})

async function createTable() {
        const qry = `
                CREATE TABLE IF NOT EXISTS todo (
                        id SERIAL PRIMARY KEY,
                        title VARCHAR(255) NOT NULL,
                        todo_date TIMESTAMP NOT NULL
                )
        `;

        try {
                await pool.query(qry);
                console.log('Table created or already exists');
        } catch (err) {
                console.error('Error creating table', err.stack);
        }
}

// Call the function after establishing the connection
createTable();

let items = [];

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function getItems() {
    const qry="SELECT * FROM todo order by id asc";
    const result = await pool.query(qry);
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
        await pool.query(qry,values);
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

    await pool.query(qry,values);

    getItems();

    res.redirect("/");
});

app.post("/delete", (req, res) => {
    const checkedItemID = req.body.deleteItemId;
    console.log(checkedItemID);

    const qry="DELETE FROM todo WHERE id=$1";
    const values=[checkedItemID];

    pool.query(qry,values);

    res.redirect("/");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});