<script lang="ts">
  import { onMount } from "svelte";
  
  import { TezosToolkit, MichelCodecPacker, MichelsonMap } from "@taquito/taquito";
  import { char2Bytes, bytes2Char } from "@taquito/utils";
  import { BeaconWallet } from "@taquito/beacon-wallet";
  import { NetworkType } from "@airgap/beacon-sdk";
  
  let Tezos: TezosToolkit;
  let wallet: BeaconWallet;
  const walletOptions = {
    name: "Jenny",
    preferredNetwork: NetworkType.FLORENCENET
  };
  let userAddress: string;
  let files, name, type, card_id, description, hp, id, damage, damageTaken, defense, grade, at1id, at1req, at1points, at1name, at2name, at2id, at2req, at2points, upgrade, pred ;

  if (process.env.NODE_ENV === "dev") {
    //title = "uranus";
    description = "this is Uranus";
  }

  const rpcUrl = "https://api.tez.ie/rpc/florencenet";
  const serverUrl =
    process.env.NODE_ENV !== "production"
      ? "http://localhost:8080"
      : "https://my-cool-backend-app.com";
  const contractAddress = "KT1F2BcW3XLPVvHJiRe9X1LswsPYmXCQVUjp";
  let nftStorage = undefined;
  let userNfts: { tokenId: number; ipfsHash: string }[] = [];
  let pinningMetadata = false;
  let mintingToken = false;
  let newNft:
    | undefined
    | { imageHash: string; metadataHash: string; opHash: string };

  const getUserNfts = async (address: string) => {
    // finds user's NFTs
    const contract = await Tezos.wallet.at(contractAddress);
    nftStorage = await contract.storage();
    const getTokenIds = await nftStorage.reverse_ledger.get(address);
    if (getTokenIds) {
      userNfts = await Promise.all([
        ...getTokenIds.map(async id => {
          const tokenId = id.toNumber();
          const metadata = await nftStorage.token_metadata.get(tokenId);
          const tokenInfoBytes = metadata.token_info.get("");
          const tokenInfo = bytes2Char(tokenInfoBytes);
          return {
            tokenId,
            ipfsHash:
              tokenInfo.slice(0, 7) === "ipfs://" ? tokenInfo.slice(7) : null
          };
        })
      ]);
    }
  };

  const connect = async () => {
    if (!wallet) {
      wallet = new BeaconWallet(walletOptions);
    }

    try {
      await wallet.requestPermissions({
        network: {
          type: NetworkType.FLORENCENET,
          rpcUrl
        }
      });
      userAddress = await wallet.getPKH();
      Tezos.setWalletProvider(wallet);
      await getUserNfts(userAddress);
    } catch (err) {
      console.error(err);
    }
  };

  const disconnect = () => {
    wallet.client.destroy();
    wallet = undefined;
    userAddress = "";
  };

  const upload = async () => {
    try {
      pinningMetadata = true;
      const data = new FormData();
      let attacks = new Array();
     
      attacks.push({atid : at1id, atname : at1name, req: at1req, attack : at1points });
      attacks.push({atid : at2id, atname : at2name, req: at2req, attack : at2points });
      data.append('card_id', card_id);
      data.append('attacks', JSON.stringify(attacks));
      data.append("image", files[0]);
      data.append("name", name);
      data.append("type", type);
      data.append("hp", hp);
      data.append("damage", damage);
      data.append("damageTaken", damageTaken);
      data.append("defense", defense);
      data.append("grade", grade);
      data.append("upgrade", upgrade);
      data.append("pred", pred);
      data.append("description", description);
      data.append("creator", userAddress);

      const response = await fetch(`${serverUrl}/mint`, {
        method: "POST",
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        body: data
      });
      if (response) {
        const data = await response.json();
        console.log(data)
        if (
          data.status === true &&
          data.msg.metadataHash &&
          data.msg.imageHash
        ) {
          pinningMetadata = false;
          mintingToken = true;
          // saves NFT on-chain
          const contract = await Tezos.wallet.at(contractAddress);
          const op = await contract.methods
            .mint(card_id, char2Bytes("ipfs://" + data.msg.metadataHash), MichelsonMap.fromLiteral({symbol: char2Bytes("JEN")}), type)
            .send();
          console.log("Op hash:", op.opHash);
          await op.confirmation();

          newNft = {
            imageHash: data.msg.imageHash,
            metadataHash: data.msg.metadataHash,
            opHash: op.opHash
          };

          files = undefined;
          name = "";
          description = "";
          type = "";
          hp = 0, 
          id = 0;
          damage = 0;
          card_id = 0;
          damageTaken = 0;
          defense = 0;
          grade = 0;
          at1id = 0;
          at1name = "";
          at1req = 0;
          at1points = 0;
          at2id = 0;
          at2req = 0;
          at2points = 0;
          at2name = "";
          upgrade = "";
          pred = "";

          // refreshes storage
          await getUserNfts(userAddress);
        } else {
          throw "No IPFS hash";
        }
      } else {
        throw "No response";
      }
    } catch (error) {
      console.log(error);
    } finally {
      pinningMetadata = false;
      mintingToken = false;
    }
  };

  onMount(async () => {
    Tezos = new TezosToolkit(rpcUrl);
    Tezos.setPackerProvider(new MichelCodecPacker());
    wallet = new BeaconWallet(walletOptions);
    if (await wallet.client.getActiveAccount()) {
      userAddress = await wallet.getPKH();
      Tezos.setWalletProvider(wallet);
      await getUserNfts(userAddress);
    }
  });

</script>



<style lang="scss">
  $tezos-blue: #2e7df7;

  h1 {
    font-size: 3rem;
    font-family: Arial, Helvetica, sans-serif;
  }

  button {
    padding: 20px;
    font-size: 1rem;
    border: solid 3px #d1d5db;
    background-color: #ffe6e6;
    border-radius: 10px;
    cursor: pointer;
  }

  .roman {
    text-transform: uppercase;
    font-family: Arial, Helvetica, sans-serif;
    font-weight: bold;
  }

  .container {
    font-size: 1.3rem;
    & > div {
      padding: 20px;
    }

    label {
      display: flex;
      flex-direction: column;
      text-align: left;
    }

    input,
    textarea {
      padding: 10px;
    }

    .user-nfts {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
</style>

<main>
  <div class="container">
    <h1>MINTING NFTS FOR JENNY</h1>
    {#if userAddress}
      <div>
        <div class="user-nfts">
          your NFTs:
          {#if nftStorage}
            [ {#each userNfts.reverse() as nft, index}
              <a
                href={`https://cloudflare-ipfs.com/ipfs/${nft.ipfsHash}`}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                {nft.tokenId}
              </a>
              {#if index < userNfts.length - 1}
                <span>,&nbsp;</span>
              {/if}
            {/each} ]
          {/if}
        </div>
        <br />
        <button class="roman" on:click={disconnect}>Disconnect</button>
      </div>
      {#if newNft}
        <div>NFT MINTED</div>
        <div>
          <a
            href={`https://cloudflare-ipfs.com/ipfs/${newNft.imageHash}`}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
             picture
          </a>
        </div>
        <div>
          <a
            href={`https://cloudflare-ipfs.com/ipfs/${newNft.metadataHash}`}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            metadata
          </a>
        </div>
        <div>
          <a
            href={`https://better-call.dev/edo2net/opg/${newNft.opHash}/contents `}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            bcd
          </a>
        </div>
        <div>
          <button class="roman" on:click={() => (newNft = undefined)}>
            Mint NFT
          </button>
        </div>
      {:else}
        <div>
          <div>Upload character picture</div>
          <br />
          <input type="file" bind:files />
        </div>
        <div>
          <label for="image-id">
            <span>Card id:</span>
            <input type="number" id="image-id" bind:value={card_id} />
          </label>
        </div>
        <div>
          <label for="image-name">
            <span>Name:</span>
            <input type="text" id="image-name" bind:value={name} />
          </label>
        </div>

        <div>
          <label for="image-description">
            <span>Description:</span>
            <input type="text" id="image-description" bind:value={description} />
          </label>
        </div>

        <div>
          <label for="image-type">
            <span>Type:</span>
            <input type="text" id="image-type" bind:value={type} />
          </label>
        </div>
        <div>
          <label for="image-hp">
            <span>HP:</span>
            <input type="number" id="image-hp" bind:value={hp} />
          </label>
        </div>
        <div>
          <label for="image-damage">
            <span>Damage:</span>
            <input type="number" id="image-damage" bind:value={damage} />
          </label>
        </div>
        <div>
          <label for="image-grade">
            <span>Grade:</span>
            <input type="number" id="image-grade" bind:value={grade} />
          </label>
        </div>
        <div>
          <label for="image-damageTaken">
            <span>Damage taken: </span>
            <input type="number" id="image-damageTaken" bind:value={damageTaken} />
          </label>
        </div>
        <div>
          <label for="image-defense">
            <span>Defense: </span>
            <input type="number" id="image-defense" bind:value={defense} />
          </label>
        </div>
        <div>
          <label for="image-upgrade">
            <span>Upgrade: </span>
            <input type="text" id="image-upgrade" bind:value={upgrade} />
          </label>
        </div>
        <div>
          <label for="image-pred">
            <span>Predecessor: </span>
            <input type="text" id="image-pred" bind:value={pred} />
          </label>
        </div>

        <div>
          <label for="image-at1">
            <span>Attack 1 id: </span>
            <input type="number" id="image-at1id" bind:value={at1id} />

            <span>Attack 1 name: </span>
            <input type="text" id="image-at1name" bind:value={at1name} />

            <span>Attack 1 kessho requirement: </span>
            <input type="number" id="image-at1req" bind:value={at1req} />

            <span>Attack 1 attack points: </span>
            <input type="number" id="image-at1points" bind:value={at1points} />
          </label>
        </div>

        <div>
          <label for="image-at2">
            <span>Attack 2 id: </span>
            <input type="number" id="image-at2id" bind:value={at2id} />

            <span>Attack 2 name: </span>
            <input type="text" id="image-at2name" bind:value={at2name} />

            <span>Attack 2 kessho requirement: </span>
            <input type="number" id="image-at2req" bind:value={at2req} />

            <span>Attack 2 attack points: </span>
            <input type="number" id="image-at2points" bind:value={at2points} />
          </label>
        </div>


        
        <div>
          {#if pinningMetadata}
            <button class="roman"> Saving your image... </button>
          {:else if mintingToken}
            <button class="roman"> Minting NFT </button>
          {:else}
            <button class="roman" on:click={upload}> Upload </button>
          {/if}
        </div>
      {/if}
    {:else}
      <div class="roman">MINTING CARDS FOR JENNY</div>
      <button class="roman" on:click={connect}>Connect your wallet</button>
    {/if}
  </div>
</main>
