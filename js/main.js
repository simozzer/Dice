(function(){

    class Player{
      constructor (name) {
        this.name = name;
        this.score = 0;
      }
    }

    const Die = {
      roll() {
        return Math.floor(Math.random() * 6) +1;
      }
    };

    class PlayerList {
      constructor() {
        this._players = [];
      }
      addPlayer(name) {
        const existingPlayer = this._players.find( player => player.name === name );
        if (!existingPlayer) {
          let newPlayer = {name : name, score : 0};
          this._players.push(newPlayer);
          return newPlayer;
        }
        return existingPlayer;
      }
      startGame() {
        this._playersInOrder = [];
        this._determineStartOrder(this._players);
        this._activePlayerIndex = -1;
        this._initUI();
        this._availableScore = 0;
        this._roundScore = 0;
        this.nextTurn(true);
      }

      allDiceSelected() {
        const dice = Array.from(document.getElementById("diceRow").children);
        let iSelCount = 0;
        dice.forEach((elem) => {
          if ( (elem.classList.contains("lockedDie")) || (elem.disabled) ) {
            iSelCount++;
          }
        });
        return (iSelCount === 6);
      }

      nextTurn(bKeepScore){
        if (this._activePlayerIndex >= 0) {
          // save score
          if (bKeepScore) {
            this._availableScore = this._availableScore + this.getSelectedScore();
            this._roundScore = this._roundScore + this.getSelectedScore();
            this._playersInOrder[this._activePlayerIndex].score += this._availableScore;
            this._playersInOrder[this._activePlayerIndex].strikes = 0;
          }
        }
        this._activePlayerIndex++;
        if (this._activePlayerIndex === this._playersInOrder.length) {
          this._activePlayerIndex = 0;
        }
        this._listPlayers();
      }

      reinitialiseDice() {
        var selectArray = Array.from(document.getElementById("selectRow").children);
        selectArray.forEach((elem)=>{
          elem.children[0].classList.add("hideme");
          elem.children[0].disabled = false;
          elem.children[0].checked = false;
        });

        var cellArray = Array.from(document.getElementById('diceRow').children);
        cellArray.forEach((elem)=>{
          elem.classList.remove("hideme");
          elem.classList.remove("lockedDie");
          elem.innerText = "-";
          elem.disabled = false;
        });
        this._keepButton.classList.add("hideme");
      }

      reset(){
        this._roundScore = 0;
        this._availableScore = 0;
        this.reinitialiseDice();
      }

      updateScore() {
        var iSelectedScore = this.getSelectedScore();
        document.getElementById("scores").innerText = `Total: ${this._availableScore} (${this._availableScore + iSelectedScore}): ${this._roundScore} (${this._roundScore + iSelectedScore}),  Selected: ${iSelectedScore}`;
      }

      /**
       * called when a user wants to bank their score
       */
      bankScore() {

        // TODO.. doesn't take account of whole score after continuing round.
        this.nextTurn(true);

        // uncheck selected boxes and convert selected to locked.
        const cells = document.getElementById("diceRow").children;
        const selectedCells = $('#selectRow input:checkbox:checked');
        selectedCells.each((index,elem) => {
          let iIndex = PlayerList.getIndexOfCheckbox(elem);
          cells[iIndex].disabled = true;
          elem.checked = false;
          elem.classList.add("hideme");
        });

        // hide all checkboxes
        $('#selectRow input:checkbox').each((i,o)=> {
          o.classList.add("hideme");
        });

        // remove checboxes ready for next roll
        this._keepButton.classList.add("hideme");
        this._resetButton.classList.remove("hideme");
        this.updateScore();
      }

      getRolledScoringDice() {
        let rolled =[];
        const cells = document.getElementById("diceRow").children;
        const cellArray = Array.from(cells);
        for (let i=0;i < 6; i++) {
          let elem = cellArray[i];
          if (!elem.disabled) {
            elem.innerHTML = Math.floor(Math.random() * 6) + 1;
            rolled.push(elem);
          }
          
        }
        return rolled;
      }

      getRolledDiceHaveScore(rolled){
        //let rolled = this.getRolledScoringDice();
        // check that we have rolled at least a 1 or a 5
        var bScored = rolled.find((elem)=>{
          let h = elem.innerHTML;
          if ((h === "1") || ( h === "5" )) {
            return elem;
          }
        });

        if (!bScored) {
          // check to see if we have 3 of a kind
          var scores = [0,0,0,0,0,0];
          rolled.forEach((elem) => {
            var diceVal = elem.innerHTML | 0;
            scores[diceVal-1]++
          });
          bScored = scores.find((val)=>{return(val > 2);});
        }
        return bScored;
      }

      /** roll the dice **/
      async rollDice(){
        //
        this._rollButton.disabled = true;
        this._resetButton.classList.add("hideme");
        this._availableScore += this.getSelectedScore();
        this._roundScore += this.getSelectedScore();
        if (this.allDiceSelected()) {
          this.reinitialiseDice();
          this._roundScore = 0;
        }

        const cells = document.getElementById("diceRow").children;

        //convert any dice with class 'lockedDie' to be disabled
        const selectedCells = $('#selectRow input:checkbox:checked');
        selectedCells.each((index,elem) => {
          let iIndex = PlayerList.getIndexOfCheckbox(elem);
          cells[iIndex].disabled = true;
          elem.checked = false;
        });
        this.updateScore();

        const rolled =  this.getRolledScoringDice();
        var bScored = this.getRolledDiceHaveScore(rolled);
        const cellArray = Array.from(cells);
        if (!bScored) {
          // strike out

          let s = "";
          rolled.forEach((elem,index)=>{
            s+= elem.innerHTML + ","
          });
          s =  s.substring(0,s.length-1);

          // this is in a set timeout at the alert was appearing before updating dice html
          window.setTimeout(() => {
            window.alert(`Strike out! You rolled ${s}`);

            var oPlayer = this._playersInOrder[this._activePlayerIndex];
            if (!oPlayer.strikes) {
              oPlayer.strikes = 1;
            } else {
              oPlayer.strikes++;
            }
            if (oPlayer.strikes === 3) {
              oPlayer.score -= 1000;
              oPlayer.strikes = 0;
            }
            this.reset();
            this.nextTurn(false);
            this._rollButton.disabled = false;

          },0);

        } else {
          //TODO:: if all dice have scored then force next roll

          //show checkboxes for rolled dice
          var selectArray = Array.from(document.getElementById("selectRow").children);
          selectArray.forEach((elem)=>{elem.children[0].classList.add("hideme")});
          rolled.forEach((elem)=>{
            if (this.getIsScoringDie(elem,rolled)) {
              let index = cellArray.indexOf(elem);
              selectArray[index].children[0].classList.remove("hideme");
              console.log(index);
            }
          });
        }
      }

      /**
       * returns true is the dice element passed is valid for scoring from within a set of rolled dice.
       * @param elem
       * @param rolled
       * @returns {boolean}
       */
      getIsScoringDie(elem, rolled) {
        var dieVal = elem.innerHTML | 0;
        if ((1 === dieVal) || (5 === dieVal)) {
          return true;
        }
        var rolledCount = 0;
        rolled.forEach((elem)=> {
          if ((elem.innerHTML | 0) === dieVal) {
            rolledCount ++;
          }
        });
        return rolledCount > 2;
      }

      static getIndexOfCheckbox (oCheckbox) {
        let oTarget = oCheckbox.parentNode;
        let aSiblings = Array.from(oTarget.parentNode.children);
        return aSiblings.indexOf(oTarget);
      }

      static getCellArray (){
        const {children} = document.getElementById("diceRow");
        return Array.from(children);
      }

      static getSelectionBoxArray(){
        const selectionArray = Array.from(document.getElementById("selectRow").children);
        return selectionArray.map((elem)=>{ return elem.children[0]});
      }

      getCheckbox(iIndex) {
        const selectionArray = Array.from(document.getElementById("selectRow").children);
        return selectionArray[iIndex].children[0];
      }

      getDie(iIndex) {
        const cellArray = Array.from(document.getElementById("diceRow").children);
        return cellArray[iIndex];
      }

      /**
       * Handle Selectiom change
       * @param oEv
       */
      selectChange(oEv) {
        const cellArray = PlayerList.getCellArray();
        var bChecked = oEv.target.checked;
        let iIndex = PlayerList.getIndexOfCheckbox(oEv.target);
        if (bChecked) {
          cellArray[iIndex].classList.add("lockedDie");
        } else {
          cellArray[iIndex].classList.remove("lockedDie");
        }
        let iScore = this.getSelectedScore();

        this._rollButton.disabled = ((iScore === 0) || (this.allDiceSelected() && ((this._roundScore + this.getSelectedScore() < 350))));
        this.updateScore();

        let selScore = this.getSelectedScore();
        if ((this._roundScore + selScore >= 350) && (selScore > 0)  && !this.allDiceSelected()) {
          this._keepButton.classList.remove("hideme");
        } else {
          this._keepButton.classList.add("hideme");
        }

        console.log(`Score: ${iScore}`);
      }

      handleDieClick(oEv) {
        console.log(oEv);
        if (oEv.target.enabled) {
          const iIndex = Array.from(oEv.target.parentElement.children).indexOf(oEv.target);
        }


      }

      getSelectedScore(){
        const selectRow = document.getElementById("selectRow");
        const selectedCells = $('#selectRow input:checkbox:checked');
        const cellArray = Array.from(document.getElementById("diceRow").children);

        const getCellsWithScore= (score) => {
          let iCellCount = 0;
          selectedCells.each((index,elem) => {
            let iCellIndex = PlayerList.getIndexOfCheckbox(elem);
            let iCellVal = cellArray[iCellIndex].innerHTML | 0;
            if (iCellVal === score) {
              iCellCount ++;
            }
          });
          return iCellCount;
        };

        let iScore = 0;

        // get multiple 1 score
        let iMatchingCells = getCellsWithScore(1);
        switch(iMatchingCells) {
          case 1:
            iScore = 100;
            break;
          case 2:
            iScore = 200;
            break;
          case 3:
            iScore = 1000;
            break;
          case 4:
            iScore = 2000;
            break;
          case 5:
            iScore = 4000;
            break;
          case 6:
            iScore = 8000;
            break;
          default:
            break;
        }

        // get multiple 5 score
        iMatchingCells = getCellsWithScore(5);
        switch(iMatchingCells) {
          case 1:
            iScore += 50;
            break;
          case 2:
            iScore += 100;
            break;
          case 3:
            iScore += 750;
            break;
          case 4:
            iScore += 1500;
            break;
          case 5:
            iScore += 3000;
            break;
          case 6:
            iScore += 6000;
            break;
          default:
            break;
        }

        // get other triplet scores
        iMatchingCells = getCellsWithScore(2);
        switch(iMatchingCells) {
          case 3:
            iScore += 200;
            break;
          case 4:
            iScore += 400;
            break;
          case 5:
            iScore += 800;
            break;
          case 6:
            iScore += 1600;
            break;
          default:
            break;
        }
        iMatchingCells = getCellsWithScore(3);
        switch(iMatchingCells) {
          case 3:
            iScore += 300;
            break;
          case 4:
            iScore += 600;
            break;
          case 5:
            iScore += 1200;
            break;
          case 6:
            iScore += 2400;
            break;
          default:
            break;
        }
        iMatchingCells = getCellsWithScore(4);
        switch(iMatchingCells) {
          case 3:
            iScore += 400;
            break;
          case 4:
            iScore += 800;
            break;
          case 5:
            iScore += 1600;
            break;
          case 6:
            iScore += 3200;
            break;
          default:
            break;
        }
        iMatchingCells = getCellsWithScore(6);
        switch(iMatchingCells) {
          case 3:
            iScore += 600;
            break;
          case 4:
            iScore += 1200;
            break;
          case 5:
            iScore += 2400;
            break;
          case 6:
            iScore += 4800;
            break;
          default:
            break;
        }

        return iScore;

      }

      _determineStartOrder(players){

        const fnCompareStartRoll = (a,b) => {
          if (a._startRoll < b._startRoll) {
            return 1
          } else if (a._startRoll > b._startRoll) {
            return -1;
          }
        };
         players.forEach((val) => {
           val._startRoll = Die.roll();
         });

         // resolve collisions
         for (let iScore = 6 ; iScore > 0; iScore --) {

            let usersWithScore = players.filter((val) => {
              if (val._startRoll === iScore) {
                return val;
              }
            });

            if (usersWithScore.length > 0) {
              if (usersWithScore.length === 1) {
                usersWithScore[0]._startRoll *= -1; // prevent reinclusion
                this._playersInOrder.push(usersWithScore[0]);
              } else {
                this._determineStartOrder(usersWithScore);
                usersWithScore.forEach((o)=>{o._startRoll = -iScore});
              }
            }
         }
      }

      _listPlayers(){
        this._playerList.innerHTML = "";
        this._playersInOrder.forEach((p,i)=>{
          var li = document.createElement('li');
          var strikes = ""
          for (let j=0; j < p.strikes; j++) {
            strikes+="X"
          }
          li.innerText = `${p.name} : ${p.score} : ${strikes} `;
          if (i === this._activePlayerIndex) {
            li.classList.add("activePlayer");
          }
          this._playerList.appendChild(li);
        });
      }

      async rollAfresh(){
        this.reset();
       // this.nextTurn(false);
        await this.rollDice();
      }

      _initUI(){
        const _rollHander = this.rollDice.bind(this);
        this._rollButton = document.getElementById("rollBtn");
        this._rollButton.addEventListener("click",_rollHander);

        this._playerList = document.getElementById("playerList");
        this._listPlayers();

        var selectRow = document.getElementById("selectRow");
        selectRow.addEventListener("change", this.selectChange.bind(this));

        var diceRow = document.getElementById("diceRow");
        diceRow.addEventListener("click", this.handleDieClick.bind(this));

        this._keepButton = document.getElementById("keepBtn");
        this._keepButton.addEventListener('click',this.bankScore.bind(this));
        this._keepButton.classList.add("hideme");

        this._resetButton = document.getElementById("restartBtn");
        this._resetButton.addEventListener('click',this.rollAfresh.bind(this));
        this._resetButton.classList.add("hideme");
      }
    }

    const players = new PlayerList();
    players.addPlayer("Simon");
    players.addPlayer("Matthew");
    players.addPlayer("Cerys");

    console.log(JSON.stringify(players._players[0]));

    // check distrib
    const distrib = [0,0,0,0,0,0];
    for (let i=0; i < 100000; i++) {
      let random = Die.roll()-1;
      distrib[random]++;
    }
    //end-check

  players.startGame();


})();
