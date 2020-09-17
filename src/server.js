import express from "express";
import bodyParser from 'body-parser';
import {MongoClient} from 'mongodb';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname,'/build')));
app.use(bodyParser.json());

async function withDB(operations,res) {
    try {
        let client = await MongoClient.connect("mongodb://localhost:27017", {useNewUrlParser: true});
        let db = client.db('my-blog');

        await operations(db);
    
        client.close();
    } catch (error) {
        res.status(500).json({"message": "error connecting to db", error});
    }
}

app.get("/api/article/:name", async (req, res) => {
    withDB(async (db)=>{
        let articleName = req.params.name;
        let articleInfo = await db.collection('articles').findOne({name:articleName});
        res.status(200).json(articleInfo);
    }, res);
})

app.post("/api/article/:name/upvote", async (req,res) => {
    withDB(async(db)=>{
        let articleName = req.params.name;
        let articleInfo = await db.collection('articles').findOne({name:articleName});
        await db.collection('articles').updateOne({name:articleName}, {
            "$set": {
                upvotes: articleInfo.upvotes + 1
            }
        });
        let updatedArticleInfo = await db.collection('articles').findOne({name:articleName});
        res.status(200).json(updatedArticleInfo);
    },res);
})

app.post("/api/article/:name/add-comment", (req,res) => {
    let {username, text} = req.body;
    let  articleName =  req.params.name;

    withDB(async (db) => {
        let articleInfo = await db.collection('articles').findOne({name:articleName});
        await db.collection('articles').updateOne({name:articleName}, {
            '$set': {
                comments : articleInfo.comments.concat({username, text})
            }
        });
        let updatedArticleInfo = await db.collection('articles').findOne({name:articleName});
        res.status(200).json(updatedArticleInfo);
    }, res);
})

app.get("*", (req,res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(8000, ()=>{console.log('server is listening at port 8000')});