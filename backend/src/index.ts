import express from "express";
import pinataSDK from "@pinata/sdk";
import fs from "fs";
const cors = require("cors");
const multer = require("multer");

const app = express();
const upload = multer({ dest: "uploads/" });
const port = process.env.NODE_ENV === "production" ? process.env.PORT : 8080; // default port to listen
let pinata: any;
if (process.env.NODE_ENV === "production") {
  pinata = pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);
} else {
  const PinataKeys = require("./PinataKeys");
  pinata = pinataSDK("12c9c29980befd3e6830",  "b67700740ad2106e661465ded28dc76b7a4693927ede576c46bd3dc430cef8fd");
}

const corsOptions = {
  origin: ["http://localhost:8082"],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })
);

// defines a route handler for the default home page
app.get("/", (req, res) => {
  res.send("Hello developers!");
});

// handles minting
app.post("/mint", upload.single("image"), async (req, res) => {
  const multerReq = req as any;
  //console.log(multerReq.file, req.body);
  console.log(req.body)
  if (!multerReq.file) {
    res.status(500).json({ status: false, msg: "no file provided" });
  } else {
    const fileName = multerReq.file.filename;
    // tests Pinata authentication
    await pinata
      .testAuthentication()
      .catch((err: any) => res.status(500).json(JSON.stringify(err)));
    // creates readable stream
    const readableStreamForFile = fs.createReadStream(`./uploads/${fileName}`);
    const options: any = {
      pinataMetadata: {
        name: req.body.name.replace(/\s/g, "-"),
        card_id : 0,
        description : "",
        type : "",
        hp : 0, 
        id : 0,
        damage : 0,
        damageTaken : 0,
        defense : 0,
        grade : 0,
        at1id : 0,
        at1req : 0,
        at1points : 0,
        at2id : 0,
        at2req : 0,
        at2points : 0,
        upgrade : "",
        pred : "",

        keyvalues: {
          description: req.body.description
        }
      }
    };
    const pinnedFile = await pinata.pinFileToIPFS(
      readableStreamForFile,
      options
    );
    if (pinnedFile.IpfsHash && pinnedFile.PinSize > 0) {
      // remove file from server
      fs.unlinkSync(`./uploads/${fileName}`);
      // pins metadata
      const metadata = {
        name: req.body.title,
        description: req.body.description,
        type : req.body.type,
        hp : req.body.hp, 
        card_id : req.body.card_id,
        damage : req.body.damage,
        damageTaken : req.body.damageTaken,
        defense : req.body.defense,
        grade : req.body.grade,
        attacks : JSON.parse(req.body.attacks),
        upgrade : req.body.upgrade,
        pred : req.body.pred,
        symbol: "JEN",
        artifactUri: `ipfs://${pinnedFile.IpfsHash}`,
        displayUri: `ipfs://${pinnedFile.IpfsHash}`,
        creators: [req.body.creator],
        decimals: 0,
        thumbnailUri: "https://www.iconsdb.com/icons/preview/deep-pink/letter-j-xxl.png",
        is_transferable: true,
        shouldPreferSymbol: false
      };

      const pinnedMetadata = await pinata.pinJSONToIPFS(metadata, {
        pinataMetadata: {
          name: "Jenny-metadata"
        }
      });

      if (pinnedMetadata.IpfsHash && pinnedMetadata.PinSize > 0) {
        res.status(200).json({
          status: true,
          msg: {
            imageHash: pinnedFile.IpfsHash,
            metadataHash: pinnedMetadata.IpfsHash
          }
        });
      } else {
        res
          .status(500)
          .json({ status: false, msg: "metadata was not pinned" });
      }
    } else {
      res.status(500).json({ status: false, msg: "file was not pinned" });
    }
  }
});



// starts the Express server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
