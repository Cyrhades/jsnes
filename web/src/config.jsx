import React from "react";

const config = {
  ROMS: {
    accuracycoin: {
      name: "AccuracyCoin",
      description: (
        <span>
          <a
            href="https://github.com/100thCoin/AccuracyCoin"
            target="_blank"
            rel="noopener noreferrer"
          >
            AccuracyCoin
          </a>{" "}
          - NES accuracy tests
        </span>
      ),
      url: "https://cdn.jsdelivr.net/gh/bfirsh/jsnes-roms@master/AccuracyCoin/AccuracyCoin.nes",
    },
    owlia: {
      name: "The Legends of Owlia",
      description: (
        <span>
          <a
            href="http://www.gradualgames.com/p/the-legends-of-owlia_1.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            The Legends of Owlia
          </a>{" "}
          by Gradual Games
        </span>
      ),
      url: "https://cdn.jsdelivr.net/gh/bfirsh/jsnes-roms@master/owlia.nes",
    },
    nomolos: {
      name: "Nomolos: Storming the Catsle",
      description: (
        <span>
          <a
            href="http://www.gradualgames.com/p/nomolos-storming-catsle.html"
            target="_blank"
            rel="noopener noreferrer"
          >
          Nomolos
          </a>{" "}
           by Gradual Games
        </span>
      ),
      url: "https://cdn.jsdelivr.net/gh/bfirsh/jsnes-roms@master/nomolos.nes",
    },
    croom: {
      name: "Concentration Room",
      description: (
        <span>
          <a
            href="http://www.pineight.com/croom/README"
            target="_blank"
            rel="noopener noreferrer"
          >
            Concentration Room
          </a>{" "}
          by Damian Yerrick
        </span>
      ),
      url: "https://cdn.jsdelivr.net/gh/bfirsh/jsnes-roms@master/croom/croom.nes",
    },
    lj65: {
      name: "LJ65",
      description: (
        <span>
          <a
            href="http://harddrop.com/wiki/LJ65"
            target="_blank"
            rel="noopener noreferrer"
          >
            LJ65
          </a>{" "}
          by Damian Yerrick
        </span>
      ),
      url: "https://cdn.jsdelivr.net/gh/bfirsh/jsnes-roms@master/lj65/lj65.nes",
    },
  },
};

export default config;
