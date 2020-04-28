const PlayerRepository = require('../repository/PlayerRepository');
const GameRepository = require('../repository/GameRepository');
const uuidv4 = require('uuid').v4;
const { buildGameInstance, buildPlayer } = require('../helpers/modelBuilders');
const { getRandomItemFromArray } = require('../Utilities');

const GameService = {
    savePlayer: (_player, playerId, isLeader = false) => {
        // const existingPlayer = PlayerRepository.getPlayerByName(_player);
        const newPlayer = buildPlayer(playerId, _player, isLeader);
        const player = PlayerRepository.addPlayer(newPlayer);
        return player;
    },
    //Save player to repository instead of playerId
    saveGameInstance: (gameId, player) => {
        const gameInstanceToAddToRepo = buildGameInstance(gameId);
        return GameRepository.addGameInstance(gameInstanceToAddToRepo);
    },
    subscribeToGameInstance: (data, player) => {
        if (!GameRepository.gameInstanceExists(data.gameId)) {
            return { errorMessage: "Game id doesnt exist!" };
        }
        GameRepository.addPlayerToGameInstance(data.gameId, player);
        const repoPlayers = GameRepository.getPlayersForGame(data.gameId);
        const players = repoPlayers.map((player) => {
            return { name: player.name, roundsLost: player.roundsLost }
        })
        return { message: `${player.name} joined the game!`, players };
    },
    isInstanceValid: (gameId) => {
        if (GameRepository.getGameInstanceById(gameId)) {
            return true;
        }
        return false;
    },
    getRandomItem: (gameId, arrayName, removeFromArray = false) => {
        const game = GameRepository.getGameInstanceById(gameId);
        let item = getRandomItemFromArray(game[arrayName], removeFromArray);
        return item;
    },
    getPlayersModel: (gameId) => {
        const players = GameRepository.getPlayersForGame(gameId);
        const modelPlayers = players.map((player) => {
            return { name: player.name, roundsLost: player.roundsLost }
        })
        return modelPlayers;
    },
    startGame: (playerId) => {
        let game = GameRepository.getGameInstanceByPlayerId(playerId);
        if (!game || !GameRepository.isPlayerGameMaster(game.id, playerId)) {
            return { errorMessage: 'Wait for the Game master to start the game' }
        } else if (game.roundStarted) {
            return { errorMessage: 'You have already started the round!' }
        } else {
            game.playerWithBomb = GameRepository.getPlayerByIdForGame(game.id, playerId);
            console.log(game.playerWithBomb);
            game.roundStarted = true;
            return { message: 'Let the games begin!', gameMasterMessage: 'Game started!', game };
        }
    },
    gameEnded: (gameId) => {
        // gameEnded = true;
        game = GameRepository.getGameInstanceById(gameId);
        const loser = GameRepository.getPlayerByIdForGame(game.id, game.playerWithBomb.id);
        loser.roundsLost++;
        return loser;
    },
    resetGame: (game) => {
        game.playerWithBomb = game.players[0];
        game.isDiceRolled = false;
        game.isCardDrawn = false;
        game.roundStarted = false;
    },
    disconnectPlayer: (game, playerId) => {
        const player = GameRepository.getPlayerByIdForGame(game.id, playerId);
        if (player.isGameMaster && game.players.length > 1) {
            const nextPlayer = GameRepository.getNextPlayer(game.id, playerId);
            console.log('next player', nextPlayer)
            nextPlayer.isGameMaster = true;
        }
        GameRepository.removePlayerFromGame(game.id, playerId);
        console.log(game);
        return { gameId: game.id, players: instance.getPlayersModel(game.id), messsage: `Successfully removed ${player.name} from game ${game.id}` };
    },
};

Object.freeze(GameService);
const instance = GameService;

module.exports = instance;