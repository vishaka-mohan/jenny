#contract KT1F2BcW3XLPVvHJiRe9X1LswsPYmXCQVUjp
#https://smartpy.io/ide?cid=QmT1Kn7rtZbtM89oM75MSxmM7CwBUUng7goqVRBEWVSgM8&k=a187fb27545a0bf44f31
import smartpy as sp

class FA2ErrorMessage:
    PREFIX = "FA2_"
    TOKEN_UNDEFINED = "{}TOKEN_UNDEFINED".format(PREFIX)
    INSUFFICIENT_BALANCE = "{}INSUFFICIENT_BALANCE".format(PREFIX)
    NOT_OWNER = "{}NOT_OWNER".format(PREFIX)
    OPERATORS_UNSUPPORTED = "{}OPERATORS_UNSUPPORTED".format(PREFIX)


class JennyErrorMessage:
    Prefix = "JennyError_"
    Duplicate_Token = "{}Duplicate_Token".format(Prefix)
    Value_Under_Zero = "{}Value_Under_Zero".format(Prefix)
    Amount_Incorrect = "{}Amount_Incorrect".format(Prefix)


class LedgerKey:
    def get_type():
        return sp.TRecord(owner=sp.TAddress, token_id=sp.TNat).layout(("owner", "token_id"))

    def make(owner, token_id):
        return sp.set_type_expr(sp.record(owner=owner, token_id=token_id), LedgerKey.get_type())


class TokenValue:
    def get_type():
        return sp.TRecord(card_token_id=sp.TNat, card_id=sp.TNat, type=sp.TString, ipfs_hash=sp.TString).layout(("card_token_id", ("card_id", ("type", ("ipfs_hash")))))


class TokenMetadataValue:
    def get_type():
        return sp.TRecord(
            token_id=sp.TNat,
            token_info=sp.TMap(sp.TString, sp.TBytes)
        ).layout(("token_id", "token_info"))


class JennyMarket:
    
    def get_value_type():
        return sp.TRecord(
            seller=sp.TAddress,
            sale_value=sp.TMutez,
        )

    def get_key_type():
        return sp.TNat


class BatchTransfer:
    def get_transfer_type():
        tx_type = sp.TRecord(to_=sp.TAddress,
                             token_id=sp.TNat,
                             amount=sp.TNat).layout(
            ("to_", ("token_id", "amount"))
        )
        transfer_type = sp.TRecord(from_=sp.TAddress,
                                   txs=sp.TList(tx_type)).layout(
                                       ("from_", "txs"))
        return transfer_type

    def get_type():
        return sp.TList(BatchTransfer.get_transfer_type())

    def item(from_, txs):
        return sp.set_type_expr(sp.record(from_=from_, txs=txs), BatchTransfer.get_transfer_type())


class BalanceOfRequest:
    def get_response_type():
        return sp.TList(
            sp.TRecord(
                request=LedgerKey.get_type(),
                balance=sp.TNat).layout(("request", "balance")))

    def get_type():
        return sp.TRecord(
            requests=sp.TList(LedgerKey.get_type()),
            callback=sp.TContract(BalanceOfRequest.get_response_type())
        ).layout(("requests", "callback"))


class OperatorParam:
    def get_type():
        t = sp.TRecord(
            owner=sp.TAddress,
            operator=sp.TAddress,
            token_id=sp.TNat
        ).layout(("owner", ("operator", "token_id")))

        return t

    def make(owner, operator, token_id):
        r = sp.record(owner=owner,
                      operator=operator,
                      token_id=token_id)
        return sp.set_type_expr(r, OperatorParam.get_type())


class JennyNFT(sp.Contract):
    def __init__(self, admin, metadata):
        self.init(
            ledger=sp.big_map(tkey=LedgerKey.get_type(), tvalue=sp.TNat),
            token_metadata=sp.big_map(tkey=sp.TNat, tvalue=TokenMetadataValue.get_type()),
            paused=False,
            administrator=admin,
            metadata=metadata,
            all_tokens=sp.set(t=sp.TNat),
            token_information=sp.big_map(tkey=sp.TNat, tvalue=TokenValue.get_type()),
            market=sp.big_map(tkey=JennyMarket.get_key_type(), tvalue=JennyMarket.get_value_type()) 
        )

        self.add_flag("initial-cast")

    def is_administrator(self, sender):
        return sender == self.data.administrator

    @sp.entry_point
    def set_administrator(self, params):
        sp.verify(self.is_administrator(sp.sender), message=FA2ErrorMessage.NOT_OWNER)
        self.data.administrator = params

    def is_paused(self):
        return self.data.paused

    @sp.entry_point
    def set_pause(self, params):
        sp.verify(self.is_administrator(sp.sender), message=FA2ErrorMessage.NOT_OWNER)
        self.data.paused = params

    @sp.entry_point
    def mint(self, params):
        sp.verify(self.is_administrator(sp.sender), message=FA2ErrorMessage.NOT_OWNER)
        token_id = sp.len(self.data.all_tokens)
        sp.verify(~ self.data.all_tokens.contains(token_id), message=JennyErrorMessage.Duplicate_Token)
        sp.set_type(params.metadata, sp.TMap(sp.TString, sp.TBytes))
        user = LedgerKey.make(sp.sender, token_id)
        self.data.ledger[user] = 1
        self.data.token_metadata[token_id] = sp.record(token_id=token_id, token_info=params.metadata)
        self.data.token_information[token_id] = sp.record(card_token_id=token_id, card_id=params.card_id, type=params.type, ipfs_hash=params.ipfs_hash)
        self.data.all_tokens.add(token_id)
        

    @sp.entry_point
    def transfer(self, batch_transfers):
        sp.set_type(batch_transfers, BatchTransfer.get_type())
        sp.for transfer in batch_transfers:
            sp.for tx in transfer.txs:
                sp.if (tx.amount > sp.nat(0)):
                    from_user = LedgerKey.make(transfer.from_, tx.token_id)
                    to_user = LedgerKey.make(tx.to_, tx.token_id)
                    sp.verify(self.data.all_tokens.contains(tx.token_id), FA2ErrorMessage.TOKEN_UNDEFINED)
                    sp.verify((self.data.ledger[from_user] >= tx.amount), message=FA2ErrorMessage.INSUFFICIENT_BALANCE)
                    sp.verify((sp.sender == transfer.from_) | (sp.source == transfer.from_), message=FA2ErrorMessage.NOT_OWNER)
                    self.data.ledger[from_user] = sp.as_nat(self.data.ledger[from_user] - tx.amount)
                    self.data.ledger[to_user] = self.data.ledger.get(to_user, 0) + tx.amount
                sp.if self.data.market.contains(tx.token_id):
                    del self.data.market[tx.token_id]
        
    @sp.entry_point
    def add_to_market(self, params):
        sp.set_type(params.token_id, sp.TNat)
        sp.set_type(params.sale_price, sp.TMutez)
        from_user = LedgerKey.make(sp.sender, params.token_id)
        sp.verify(self.data.all_tokens.contains(params.token_id), FA2ErrorMessage.TOKEN_UNDEFINED)
        sp.verify(params.sale_price > sp.mutez(0), JennyErrorMessage.Value_Under_Zero)
        sp.verify(self.data.ledger.contains(from_user), message=FA2ErrorMessage.NOT_OWNER)
        sp.verify((self.data.ledger.get(from_user, sp.nat(0)) >= 1), message=FA2ErrorMessage.INSUFFICIENT_BALANCE)
        self.data.market[params.token_id] = sp.record(seller=sp.sender, sale_value=params.sale_price)

    @sp.entry_point
    def buy(self, params):
        sp.set_type(params.token_id, sp.TNat)
        sp.verify(self.data.all_tokens.contains(params.token_id), FA2ErrorMessage.TOKEN_UNDEFINED)
        sp.verify(self.data.market.contains(params.token_id), FA2ErrorMessage.TOKEN_UNDEFINED)
        sp.verify(self.data.market[params.token_id].sale_value == sp.amount, JennyErrorMessage.Amount_Incorrect)
        seller = LedgerKey.make(self.data.market[params.token_id].seller, params.token_id)
        buyer = LedgerKey.make(sp.sender, params.token_id)
        self.data.ledger[seller] = sp.as_nat(self.data.ledger[seller] - 1)
        self.data.ledger[buyer] = 1
        sp.send(self.data.market[params.token_id].seller, sp.amount)
        del self.data.market[params.token_id]

    @sp.entry_point
    def balance_of(self, balance_of_request):
        sp.set_type(balance_of_request, BalanceOfRequest.get_type())
        responses = sp.local("responses", sp.set_type_expr(sp.list([]), BalanceOfRequest.get_response_type()))
        sp.for request in balance_of_request.requests:
            responses.value.push(sp.record(request=request, balance=self.data.ledger.get(
                LedgerKey.make(request.owner, request.token_id), 0)))
        sp.transfer(responses.value, sp.mutez(0), balance_of_request.callback)

    @sp.entry_point
    def update_operators(self, params):
        sp.set_type(params, sp.TList(sp.TVariant(
                add_operator=OperatorParam.get_type(),
                remove_operator=OperatorParam.get_type())))
        sp.failwith(FA2ErrorMessage.OPERATORS_UNSUPPORTED)

if "templates" not in __name__:
    @sp.add_test(name="Jenny NFT")
    def test():
        scenario = sp.test_scenario()
        scenario.h1("Jenny NFT")

        admin = sp.address("tz1eoiykKbb4uvZxdTUPZDdwx7ssqDG6od9g")
        alice = sp.test_account("Alice")77p
        bob = sp.test_account("Bob")
        dan = sp.test_account("Dan")

        scenario.show([alice, bob, dan])

        c1 = JennyNFT(
            admin=admin,
            metadata=sp.utils.metadata_of_url("https://gist.githubusercontent.com/vishaka-mohan/c00b5c3cbd228e8a115f787011cb13a1/raw/1caf8947799e488201d3bb552815f6107fcb9e51/jenny_metadata.json"),
            )

        scenario += c1

        scenario.h2("Initiate initial minting")
        scenario += c1.mint(metadata={'': sp.utils.bytes_of_string('x')}, card_id=0, type="Character",
                            ipfs_hash="ipfs://QmVdbn8QvAADa5ydnqn4dwRdixJiaCHgrWhrxsZ56ZK2vY").run(sender=admin)
        scenario += c1.mint(metadata={'': sp.utils.bytes_of_string('z')}, card_id=0, type="Character",
                            ipfs_hash="ipfs://QmVdbn8QvAADa5ydnqn4dwRdixJiaCHgrWhrxsZ56ZK2vY").run(sender=admin)
        scenario += c1.mint(metadata={'': sp.utils.bytes_of_string('q')}, card_id=0, type="Character",
                            ipfs_hash="ipfs://QmVdbn8QvAADa5ydnqn4dwRdixJiaCHgrWhrxsZ56ZK2vY").run(sender=admin)
        scenario += c1.mint(metadata={'': sp.utils.bytes_of_string('w')}, card_id=0, type="Item",
                            ipfs_hash="ipfs://QmVdbn8QvAADa5ydnqn4dwRdixJiaCHgrWhrxsZ56ZK2vY").run(sender=admin)
        scenario += c1.mint(metadata={'': sp.utils.bytes_of_string('e')}, card_id=0, type="Kessho",
                            ipfs_hash="ipfs://QmVdbn8QvAADa5ydnqn4dwRdixJiaCHgrWhrxsZ56ZK2vY").run(sender=admin)

        