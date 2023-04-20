import "../App.css";
import { useState, useEffect } from "react";
import Table from "react-bootstrap/Table";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import styled, { keyframes } from "styled-components";
import Slider from "@mui/material/Slider";
import axios from "axios";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';




import {
  highlightLabel,
  getCentroid,
  findMatchingPoints,
  clearSelectedMatchingPoints,
  reset,
  drawTestProjection,
} from "../d3-rendering/projectionManipulationFunctions.js";
import { InfoTooltip } from "./InfoTooltip.js";
import { text } from "d3";


const localDevURL = "http://127.0.0.1:8000/";

const DEFAULT_PROMPT =
  "What is the common theme between the selected sentences?";

// Loading animation
const breatheAnimation = keyframes`
 0% { opacity: 0.6; }
 50% { opacity: 1; }
 100% { opacity: 0.6; }`;

const PlaceholderImage = styled.img`
  animation-name: ${breatheAnimation};
  animation-duration: 1.5s;
  animation-iteration-count: infinite;
`;

const LabelSearch = () => {
  const [substring, setSubstring] = useState("");

  const handleSubstringChange = (e) => {
    setSubstring(e.target.value);
  };

  const enterSubmit = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    clearSelectedMatchingPoints();
    reset();
    findMatchingPoints(substring);
  };

  const handleReset = () => {
    clearSelectedMatchingPoints();
    reset();
  };

  return (
    <>
      <Form.Group className="mb-3" controlId="findSubstring">
          
        <div className="button-box">
          <Form.Control
            type="substring"
            size="sm"
            placeholder="Enter Keywords"
            onChange={handleSubstringChange}
            onKeyPress={enterSubmit}
          />
          <Button
            size="sm"
            variant="secondary"
            type="submit"
            onClick={handleSubmit}
          >
            Search
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            className="resetButton"
            onClick={handleReset}
          >
            reset
          </Button>
        </div>
      </Form.Group>
    </>
  );
};

// Analysis panel for displaying info
export const RightPanel = ({
  selectedPoints,
  pathPoints,
  topWords,
  wordsLoading,
  prompt,
  setPrompt,
  explanation,
  keyVal,
  setKeyVal,
  test_text,
  setTestText,
  autoClusterLabel,
  setautoClusterLabel,
  onautoClusterLabelchange 
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [promptValue, setPromptValue] = useState(prompt);
  const associatedWordsExplanation =
    "We run a linear classifier on points in the circled area versus points not in the circled area. We return the top 30 words that are positively and negatively associated with being in the circled area";
  
    const toggleExpDiv = (e, id, txt) => {
      ["cloud-div","new-text","natural-language-explanation","explore-selection"].map(id => document.getElementById(id).style.display = "none")

      document.getElementById('explanation-type').textContent = txt
      var x = document.getElementById(id);
      if (x.style.display === "none") {
        x.style.display = "block";
      } else {
        x.style.display = "none";
      }
    }

    const toggleDiv = (e, id, txt) => {
      var x = document.getElementById(id);
      if (x.style.display === "none") {
        x.style.display = "block";
      } else {
        x.style.display = "none";
      }
    }


    window.onload = function(){
      ["new-text","natural-language-explanation","explore-selection"].map(id => document.getElementById(id).style.display = "none")

      document.getElementById('toggleButton1').click();
      //document.getElementById('toggleButton2').click();
      document.getElementById('toggleButton3').click();
    }

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClickMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  

  const handleClose = (e,id, txt) => {
    if (id !=""){toggleExpDiv(e, id, txt)}
    setAnchorEl(null);
  }
  
  // Generates table items if there are selected points
  useEffect(() => {
    if (selectedPoints.length > 0) {
      let labelDict = {};

      // Calculates centroid of lassoed area
      console.log(pathPoints,selectedPoints)

      let centroid = {x:0, y:0}

      if (pathPoints.length != 0) {
        let centroid = getCentroid(pathPoints);

      }

      for (let point of selectedPoints) {
        // Creates ids for a table item, if there are multiple of the same label, this allows you to map from the table item to the labels
        if (point.label in labelDict) {
          labelDict[point.label].id =
            labelDict[point.label].id + " " + point.id;
        } else {
          labelDict[point.label] = { id: point.id };
        }

        // Calculates distance from the centroid of the lassoed area to the point
        labelDict[point.label].distFromCentroid = Math.sqrt(
          (point.cx - centroid.x) ** 2 + (point.cy - centroid.y) ** 2
        );
      }

      // Sorts labels by distance from the centroid
      let labelsArray = Object.entries(labelDict);
      labelsArray.sort(function (a, b) {
        return a[1].distFromCentroid - b[1].distFromCentroid;
      });

      let newSelectedItems = [];
      for (let [label, countInfo] of labelsArray) {
        // Highlights top words in the label if topwords is populated
        if (topWords.positiveWord !== null) {
          let splitLabel = label.split(" ");
          for (let i = splitLabel.length - 1; i > -1; i--) {
            let lowercaseCopy = splitLabel[i]
              .toLowerCase()
              .replace(/[.,/#!$?%^&*;:"{}=\-_`~()]/g, "");

            switch (lowercaseCopy) {
              case topWords.positiveWords[0]:
                splitLabel[i] = (
                  <mark key={countInfo.id} className="positive-mark-1">
                    {splitLabel[i]}
                  </mark>
                );
                break;
              case topWords.positiveWords[1]:
                splitLabel[i] = (
                  <mark key={countInfo.id} className="positive-mark-2">
                    {splitLabel[i]}
                  </mark>
                );
                break;
              case topWords.positiveWords[2]:
                splitLabel[i] = (
                  <mark key={countInfo.id} className="positive-mark-3">
                    {splitLabel[i]}
                  </mark>
                );
                break;
              case topWords.negativeWord:
                splitLabel[i] = (
                  <mark key={countInfo.id} className="negative-mark">
                    {splitLabel[i]}
                  </mark>
                );
                break;
              default:
                break;
            }

            // Adds space
            if (i === splitLabel.length - 1) {
              continue;
            } else {
              splitLabel.splice(i + 1, 0, " ");
            }
          }
          label = splitLabel;
          // console.log("newLabel", lab el);
        }
        newSelectedItems.push(
          <tr key={countInfo.id} onClick={(e) => highlightLabel(e)}>
            <td>{newSelectedItems.length + 1}</td>
            <td id={countInfo.id} className="label">
              {label}
            </td>
          </tr>
        );
      }

      setSelectedItems(newSelectedItems);
    } // Update selected items if selection is cleared
    else if (selectedPoints.length === 0 && selectedItems.length > 0) {
      setSelectedItems([]);
    }
  }, [selectedPoints, topWords, pathPoints, selectedItems.length]);

  const handleNewPrompt = (e) => {
    if (promptValue !== "") {
      setPrompt(promptValue);
    }

    console.log(promptValue);

    //document.querySelector("#promptTextArea").value = "";
  };

  const handleChangePrompt = (e) => {
    setPromptValue(e.target.value);
  };

  

  const handleChangeText = (e) => {
    setTestText(e.target.value)
};

const handleTextClick = (e) => {
  axios
    .post(localDevURL + "test-projection", {
      text: test_text,
      dataset: document.getElementById('dataset').textContent

    })
    .then((response) => {
      drawTestProjection(response.data.data)
    })
    .catch((error) => {
      console.log(error);
    });
};

  

  const handleChangeKey = (e) => {
    console.log("setting key value:", e.target.value);
    setKeyVal(e.target.value);
  };

  const handleChangeautoClusterLabel = (e) => {
    console.log("setting clusterlabel value:", e.target.value);
    setautoClusterLabel(e.target.value);
    onautoClusterLabelchange()
  };
  
  const handleReset = () => {
    setPrompt(DEFAULT_PROMPT);
    document.querySelector("#promptTextArea").value = "";
  };


  return (
    
    <div className="right panel">
      <LabelSearch />
      <hr />
      <div id="auto-explanation">
        <p className="title">AutoCluster Explanation</p>
        <div className="autoExplanationslider">
          <Slider
            id="explanation-slider"
            aria-label="AutoCluster Label"
            value={autoClusterLabel}
            valueLabelDisplay="auto"
            onChange={handleChangeautoClusterLabel}
            step={1}
            marks
            min={1}
            max={30}
          />
      </div></div>
      <hr />

      <Button
        variant="light"
        id="menu-buttion-1"
        aria-controls={open ? 'demo-positioned-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClickMenu}
      >
      <h5 id="explanation-type">Explanation as Keywords</h5>
      </Button>
      <Menu
        id="menu-1"
        aria-labelledby="demo-positioned-button"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={(e) => { handleClose(e,  "cloud-div", "Explanation as Keywords");}}>Explanation as Keywords </MenuItem>
        <MenuItem onClick={(e) => { handleClose(e, "new-text", "Explanation by Example");}}> Explanation by Example </MenuItem>
        <MenuItem onClick={(e) => { handleClose(e, "natural-language-explanation", "Explanation by Conversation");}}> Explanation by Conversation</MenuItem>
        <MenuItem onClick={(e) => { handleClose(e, "explore-selection", "Explore Selection");}}> Explore Selection</MenuItem>

      </Menu>
      <div id="new-text" >


      <Form.Control
            className="form-control"
            id="TestProjectionArea"
            size="sm"
            as="textarea"
            placeholder={"Enter Text Here to creat new projection point"}
            onChange={handleChangeText}
          ></Form.Control>
      <Button
            size="sm"
            variant="secondary"
            type="submit"
            onClick={handleTextClick}>
            Show
          </Button>
          </div>


      <div id="cloud-div">
        <div id="positive-cloud-div">
          {wordsLoading ? (
            <PlaceholderImage
              src="https://storage.googleapis.com/htw-website-uploads/Grey-placeholder-image2.jpg"
              className="placeholder-image"
              id="pos-placeholder"
            />
          ) : null}
        </div>
      </div>


      <div id="natural-language-explanation">
        <Form.Group>
          <Form.Control
            className="form-control"
            size="sm"
            placeholder={keyVal === "" ? "OpenAI Key" : keyVal}
            onChange={handleChangeKey}
          ></Form.Control>
          <Form.Control
            className="form-control"
            id="promptTextArea"
            size="sm"
            as="textarea"
            rows={3}
            placeholder={"current prompt: " + prompt}
            onChange={handleChangePrompt}
          ></Form.Control>
          <div className="button-box">
            <Button
              size="sm"
              variant="secondary"
              type="submit"
              onClick={handleNewPrompt}
            >
              Set Prompt
            </Button>
            <Button
              size="sm"
              variant="outline-secondary"
              className="resetButton"
              onClick={handleReset}
            >
              Reset
            </Button>
          </div>
        </Form.Group>
        <Form.Control
            className="form-control"
            id="explanation"
            size="sm"
            as="textarea"
            rows={3}
            placeholder={explanation}
            //onChange={handleChangePrompt}
          ></Form.Control>
      </div>

      <div id="explore-selection">

      <div id="unique-items-div">
        <p className="title">
          {selectedItems.length > 0
            ? selectedItems.length + " total unique"
            : 0}{" "}
          items
        </p>
      </div>
      <div className="tableDiv">
        <Table bordered>
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
            </tr>
          </thead>
          <tbody>{selectedItems}</tbody>
        </Table>
      </div>
      </div>
      <div className="footerSpacing"></div>
    </div>
  );
};

