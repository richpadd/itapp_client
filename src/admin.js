// ================================================================================================
// ITMD-504 - Programming and Application Foundations
// Final Project - IT Terms 
// Richard Paddock (A20603128)
// ----------------------------------------------------------------------------
// File: app/admin.js (built to react app and renamed in production as adminapp.html)
// Descripton: This is the main React web app code for managing the CRUD actions for the IT terms database
// ----------------------------------------------------------------------------

// ---------------    Import React Libraries ------------------------------

import React, { useState, useEffect } from 'react';    // Primary react librares
import { Modal, Button } from 'react-bootstrap';       // Bootstrap imports for dialogue box (modal) and buttons

// ================================================================================================
// Main App

const AdminApp = () => {
  // ---------------    State / Variable Setup ------------------------------

  // Object for our input form consisting of the term ID, Name, Category,  Definition, Quiz Flag and Quiz Alternatives
  const formObject = {catid: 0, catname: '', termid: 0, termname: '', definition: '', alt1: '', alt2: '', alt3: ''}

  // Hold the state of the current and original input form
  const [currentData, setCurrentData] = useState(formObject);           // Holds the current data in the top form
  const [originalData, setOriginalData] = useState(formObject);         // Holds a copy of the original data to enable the discard function

  // State item for category drop-downs
  const [categories, setCategories] = useState([]);                     // Holds categories for the drop-down lists

  // State items for our table selector
  const [filteredCategory, setFilteredCategory] = useState('');         // Holds the category to be filtered on
  const [filteredName, setFilteredName] = useState('');                 // Holds the text to be filtered on
  const [terms, setTerms] = useState([]);                               // Holds complete array of all terms loaded
  const [filteredTerms, setFilteredTerms] = useState([]);               // Holds a filtered view of the terms for display 

  // State items for handling the modal box
  const [showModal, setShowModal] = useState(false);                    // Manages display of the modal (message box)
  const [buttonType, setButtonType] = useState('');                     // Enables different messages/buttons to be used in the modal
  const [modalTitle, setModalTitle] = useState('');                     // Holds the modal heading
  const [message, setMessage] = useState('');                           // Holds the modal sub-text
  const [button1, setbutton1] = useState('');                           // Holds text for the first button 
  const [button2, setbutton2] = useState('');                           // Holds text for the (optional) second button

  // State items for the action buttons
  const [showSave, setShowSave] = useState(false);                      // Holds save/discard state  i.e. updates have been made 
  const [showAddDelete, setShowAddDelete] = useState(false);            // Holds add/delete state i.e. record selected, no changes made
  const [showAdd, setShowAdd] = useState(false);                        // Holds the add/discard state i.e. new record entry commenced

  // State items for the user login
  const [apiURL, setApiURL] = useState("");                             // Holds the URL for the API Server
  const [user, setUser] = useState(null);                               // Holds the current logged in user
  const [username, setUsername] = useState("");                         // Holds the username for the login box
  const [password, setPassword] = useState("");                         // Holds the password for the login box
 
  // ================================================================================================
  // ---------------  EXTERNAL API Call Functions ------------------------------
  
  // ---- LOGIN HANDLING ----

  // Called by the login box and passed username and password to check against the server 
  const login = async () => {
    // Do nothing if either username or password are empty
    if (password !== "" && username !== ""){
      const res = await fetch(apiURL+"/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username, password })
      });

      // Valid login so set the user (will trigger the main app to display) and load the page info
      if (res.ok) {
        setUser(username);
        fetchCategories();
        fetchTerms();
      }
      else openModal('loginfail','Incorrect Login','Please try again','Ok','');
    }
  };

  // Allow enter key on login screen in addition to the button - because I kept forgetting to click the button!
  const handleLoginKeyPress = (e) => {
    if (e.key === 'Enter') {login()}
  };

  // Logout will call the API to end the session and remove the current user info, triggering the login box to display
  const logout = async () => {
      await fetch(apiURL+"/api/logout", { method: "POST", credentials: "include" });
      setUser(null);
  };

  // ---- FUNCTIONALITY HANDLING ------

  // Fetch all of the categories from our public API 
  const fetchCategories = async () => {
    try {
      const response = await fetch(apiURL+"/public-api/categories", {
        method: "GET",
    });
      const data = await response.json();
      if (!response.ok) throw new Error('Failed to fetch categories');  
      setCategories(data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  
  //----------------------------------------------------------------------------------
  // Fetch all the IT terms from our public API
  // This is only done on load and update/delete to avoid excessive calls. Table filtering is done by using a separate display list 

  const fetchTerms = async () => {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
  
      // Build URL and execute
      const url = `${apiURL}/public-api/terms${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        method: "GET",
    });
      const data = await response.json();
      if (!response.ok) throw new Error('Failed to fetch terms');  
      setTerms(data.data);
    } catch (error) {
      console.error('Error fetching terms:', error);
    }
  };

  //----------------------------------------------------------------------------------
  // Call the delete term API to delete an existing term

  const deleteTerm = async () => {
    try {
      const response = await fetch(apiURL+"/api/terms", {
        method: 'DELETE',
        credentials: "include",
        headers: {'Content-Type': 'application/json',},
        body: JSON.stringify({termid: currentData.termid}),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);     
      }
    } catch (error) {
      openModal('failure','Error',error.message,'Ok','')
      return;
    }
    // Successfully deleted so reset the form/buttons and show the success message
    setCurrentData(formObject);
    setShowAddDelete(false);
    setShowAdd(false);
    // Reload the selector table to remove entry
    fetchTerms();
    openModal('success','Delete Term','Item Removed Successfully','Ok','')
  };
  
  //----------------------------------------------------------------------------------
  // Call the Post term API to add a new term
  const postTerm = async () => {
    try {
      const response = await fetch(apiURL+"/api/terms", {
        method: 'POST',
        credentials: "include",
        headers: {'Content-Type': 'application/json',},
        body: JSON.stringify({termname: currentData.termname, catname: currentData.catname, 
          definition: currentData.definition,alt1:currentData.alt1,alt2:currentData.alt2,alt3:currentData.alt3}),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);     
      }
    } catch (error) {
      openModal('failure','Error',error.message,'Ok','')
      return;
    }
    // Successfully added so reset the form/buttons and show the success message
    setCurrentData(formObject);
    setShowAddDelete(false);
    setShowAdd(false);
    // Reload the selector table to show the new entry
    fetchTerms();
    openModal('success','New Item','Added Successfully','Ok','')
  };

    //----------------------------------------------------------------------------------
  // Call the Put term API to update this term
  const updateTerm = async () => {
    try {
      const response = await fetch(apiURL+"/api/terms", {
        method: 'PUT',
        credentials: "include",
        headers: {'Content-Type': 'application/json',},
        body: JSON.stringify({termid: currentData.termid, termname: currentData.termname, catname: currentData.catname, 
          definition: currentData.definition,alt1:currentData.alt1,alt2:currentData.alt2,alt3:currentData.alt3}),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);     
      }
    } catch (error) {
      openModal('failure','Error',error.message,'Ok','')
      return;
    }
    // Successfully updated so reset the buttons and show the success message
    setShowSave(false);
    setShowAddDelete(true);
    // Reload the selector table to show the updated entry
    fetchTerms();
    openModal('success','Item Changes','Updated Successfully','Ok','')
  };

  // ================================================================================================
  // ---------------    Initial Mouting Functions ------------------------------

  useEffect(() => {

   // Set the Dev vs Prod API URL (i tried to get this configurable in the ENV file, but no luck, so using React built-in setting)
    if (process.env.NODE_ENV === "development"){
      setApiURL("http://localhost:3000");}
      else{setApiURL("https://rpadd.duckdns.org");
    }

    // Check if already logged in first (e.g. hit refresh), if so, set the user info and load the page info
    // Then get all of the categories and terms for building the screen
    fetch(apiURL+"/api/auth", { credentials: "include" })
    .then(res => res.json())
    .then(data => setUser(data.user))
    .then(() => fetchCategories())
    .then(() => fetchTerms())

    // Otherwise set no user logged in, which conditions only the login box to display 
    .catch(() => setUser(null));
  }, []);

  // =================================================================================================
  // ---------------    Event Handling Functions ------------------------------

  // ---- INPUT FORM ----

  // Input Form Updated
  const handleFormChange = (e) => {const { name, value } = e.target;
    // This updates the passed in variable of the current form object with the passed in value
    setCurrentData((prevData) => ({...prevData,[name]: value,}));
    handleFormChangeButtons();
  }

  // Clicked a button
  const handleFormChangeButtons = () => {
    // If the delete button is not active then we have edited a blank box - so this is a new addition, show the Add and Discard buttons, remove delete
    if (!showSave && !showAddDelete){
      setShowAdd(true); // Show the Add and Discard buttons
      setShowAddDelete(false);

    // Else we have updated an existing record so ensure the Update button is shown and the Add/Discard buttons hidden
    } else {
      setShowSave(true);
      setShowAddDelete(false);
    }                                               
  };

  // ---- TABLE SELECTOR ----

  // Update the filtered terms list for display based on the category filter and whether a term name includes any of the search term letters
  // This is triggered whenever there is a change on the category or name filters, or on the master list terms (i.e. re-fetched the main list)
  useEffect(() => {
    setFilteredTerms(
      terms.filter(term => 
        (filteredCategory ? term.catname === filteredCategory : true) &&
        (filteredName ? term.termname.toLowerCase().includes(filteredName.toLowerCase()) : true)
      )
    );
  }, [filteredCategory, filteredName, terms]); // Runs when any of these change

  // Update the category filtering
  const handleCategoryFilter = (e) => {
    setFilteredCategory(e.target.value);
  };

  // Update the dynamic name filtering 
  const handleNameFilter = (e) => {
    setFilteredName(e.target.value);
  };

  // ---- TABLE ROWS ----

  // Clicked on a table row
  const handleRowClick = (term) => {
    // If we have unsaved changes, don't change the form to show this row, we need to ask to save first
    if (showSave || showAdd) {
      openModal('incomplete','Unsaved Changes','Please action the changes first','Ok','')}
    else {
      setCurrentData(term);
      setOriginalData(term);
      setShowAddDelete(true); 
    }
  };

 // --- BUTTON PRESS ----
 
 // Deals with all the different combinations of button push
 const handleButtonClick = (clickType) => {
  // Call the message modal passing the relevant data for the passed button type
  switch (clickType) {

    // Delete this record
    case 'delete': {openModal('delete','Delete Item','Are you sure you want to delete "'+currentData.termname+'"','Delete','Cancel'); break;}
   
    // Start a new record - 
    case 'new': {
      // Update current form to blanks and reset buttons
      setCurrentData(formObject);
      setOriginalData(formObject);
      setShowAddDelete(false);
      break;
    }

    // Discard a new addition - 
    case 'discardNew': {
      // Update the Current Form to blanks
      setCurrentData(formObject);
      setShowAdd(false);
      break;
    }

    // Save the updates or additions - 
    case 'add' : 
    case 'save' :
    {
      // Check that all the necessary info has been input
      if (currentData.termname !=='' && currentData.catname !== '' && currentData.definition !==''){
        // Check that the alt strings are either all blanks or all filled 
        if ((currentData.alt1 === '' && currentData.alt2 === '' && currentData.alt3 === '') ||
           (currentData.alt1 !== '' && currentData.alt2 !== '' && currentData.alt3 !== '')) {

          if (clickType === 'add'){postTerm();}    // call the post API
          else{updateTerm();}                     // call the update API
        }
        else {openModal('incomplete','Error','Quick text should be all blanks (exclude from quiz) or all completed','Ok','')}
      }
      else {openModal('incomplete','Incomplete Item','You need to input all of the necessary information','Ok','')}
      break;
    }

    // Discard an updated record - 
    case 'discardUpdate': {
      // Update the Current Form to the original entry
      setCurrentData(originalData);
      setShowSave(false);
      setShowAddDelete(true);
      break;
    }

    // Catch-all
    default: console.log('Something went wrong in the handle button click case selection!');

  } // End - Switch
 }
  // ================================================================================================
  // -------------------------- Modal Handling ------------------------------------------

  // Set the Modal box using the parameters passed in
  const openModal = (type,title,message,button1,button2) => {
    setButtonType(type);     // Button type - this will decide the action
    setModalTitle(title);    // Box title
    setMessage(message);     // Message detail
    setbutton1(button1);     // Text on button 1
    setbutton2(button2);     // Text on button 2 (it will hide this button if sent blanks)
    setShowModal(true);      // Display status
  };

  const closeModal = () => setShowModal(false);

  // Handle the Modal Button Click Reponses - Originally I expected more hence this coding, but actually most are just 'OK' !
  const handleResponse = (type,response) => {

    setShowModal(false);  // Close the modal 

    const combinedResponse = `${type}-${response}`
    switch (combinedResponse) {

      // Delete Confirmed - Call the delete routine
      case 'delete-pressed1':{
        deleteTerm();
        break;}

      // Many cases are going to be just an Ok, no action required
      default: break;
    }
  };

  // ================================================================================================
  // ------------------------    Main HTML Code  ------------------------------

  return (

    <div className="main">
      {/* ----------------------------------  Header Section  -------------------------------------*/}  
      <div>
        <div className="header row d-flex align-items-center">
          <div className="col text-start"><h1>IT Terms <span className="head-span">Admin Console</span></h1></div>
          <div className="col text-start">
            <a className="d-block" href="index.html">&gt; Landing Page</a>
            <a className="d-block" href="termslist.html">&gt; Glossary</a>
            <a className="d-block" href="termsquiz.html">&gt; Quiz</a>
            {user && (<button className="d-block logout-button" onClick={logout}>Logout</button>)}
          </div>
        </div>
      </div>

      {/* ----------------------------------  Login Box  -------------------------------------*/}
      {/* Conditionally display this if no user is active */}
      {!user && (<>            
        <div className="login"> 
          <h2>Login</h2>
          <div className="row pb-2">
              <div className="col-md-3 login-col">
              <input className="form-control" placeholder="Username" onKeyDown={handleLoginKeyPress} onChange={e => setUsername(e.target.value)}/>
            </div>
              <div className="col-md-3 login-col">
              <input className="form-control" type="password" placeholder="Password" onKeyDown={handleLoginKeyPress} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="col-md-3 login-col">
              <button onClick={login}>Login</button>
            </div>
          </div>
        </div>
      </>)}

      {/* ----------------------------------  Top Input Section  -------------------------------------*/}    
      
      {/* Conditionally display this if a user is active  */}    
      {user && (<div className="main-app">
        <div className="form-container">
        
          <div className="row pb-2">

            {/* Term Name Entry */}
            <div className="col-md-3"><span className="form-labels">Name</span>
                <input type="text" name="termname" id="termname" value={currentData.termname} onChange={handleFormChange} className="form-control" placeholder="IT Term Name"/>
            </div>  

            {/* Category Selection */}
            <div className="col-md-3"><span className="form-labels">Category</span>
                <select type="text" name="catname" id="catname" value={currentData.catname} onChange={handleFormChange} className="form-control">
                  <option value="">Select a Category</option>{categories.map((category) => (<option key={category.id} value={category.name}>{category.name}</option>))}
                </select>
            </div>
          </div>

          {/* Definition Entry */}
          <div className="row pb-2">
            <div className="col-md-12"><span className="form-labels">Term Definition</span>
              <textarea type="text" name="definition" id="definition" value={currentData.definition} onChange={handleFormChange} 
              className="form-control" rows="2" placeholder="IT Term Definition"/>
            </div>
          </div>

          {/* Quiz Definition Section - 3 entries in columns  */}
          <div className="row pb-2">
            
            <div className="col-md-4"><span className="form-labels">Quiz Alternative 1</span>
                <textarea type="text" name="alt1" id="definition" value={currentData.alt1} onChange={handleFormChange} 
                className="form-control" rows="3" placeholder="Quiz Alternative 1"/>
            </div>

            <div className="col-md-4"><span className="form-labels">Quiz Alternative 2</span>
                <textarea type="text" name="alt2" id="definition" value={currentData.alt2} onChange={handleFormChange} 
                className="form-control" rows="3" placeholder="Quiz Alternative 2"/>
            </div> 
              
            <div className="col-md-4"><span className="form-labels">Quiz Alternative 3</span>
                <textarea type="text" name="alt3" id="definition" value={currentData.alt3} onChange={handleFormChange} 
                className="form-control" rows="3" placeholder="Quiz Alternative 3"/>
            </div> 
          </div> 
        
          <div className='button-section'>
            {/* Conditionally show the Add, Save, Delete and Discard buttons */}
            {showAddDelete && (<button onClick={() => handleButtonClick('delete')} className="btn btn-danger py-1 adminButton">Delete Item</button>)}
            {showAddDelete && (<button onClick={() => handleButtonClick('new')} className="btn btn-success py-1 adminButton">Start New</button>)}
            {showSave && (<button onClick={() => handleButtonClick('save')} className="btn btn-success py-1 adminButton">Save Changes</button>)}
            {showSave && (<button onClick={() => handleButtonClick('discardUpdate')} className="btn btn-danger py-1 adminButton">Discard Changes</button>)}
            {showAdd && (<button onClick={() => handleButtonClick('add')} className="btn btn-success py-1 adminButton">Add New</button>)}
            {showAdd && (<button onClick={() => handleButtonClick('discardNew')} className="btn btn-danger py-1 adminButton">Discard</button>)}
            {!showAddDelete && !showSave && !showAdd &&(<span>Input New above or select a row to change</span>)}
          </div>   
        </div> {/* End form container */}

        {/* ----------------------------------  Bottom Selection Section  -------------------------------------*/}

        {/* Uses bootstrap table */}
        <div className="table-container">
          <div className="table-responsive">
            <table className="table table-striped">
              <thead className="sticky-header">
                <tr>
                  <th className="col-1">
                    {/* Drop-down selector to filter the category */}
                    <select id="category" value={filteredCategory} onChange={handleCategoryFilter} className="form-control">
                      <option value="">Show All</option>{categories.map((category) => (<option key={category.id} value={category.name}>{category.name}</option>))}
                    </select>
                  </th>
                  <th className="col-2">
                    {/* Text box to filter the name */}
                    <input type="text"id="name" value={filteredName} onChange={handleNameFilter} className="form-control" placeholder="Type to Filter"/>
                  </th>
                  <th className="col-3"></th>
                </tr>
              </thead>
              <tbody>
                {/* Loop through all of the terms */}
                {filteredTerms.map((fterm, index) => (
                  <tr key={index} onClick={() => handleRowClick(fterm)}>
                    <td>{fterm.catname}</td><td>{fterm.termname}</td><td>{fterm.definition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>  {/* End Table Container */} 
      </div>)}
       
      {/* ----------------------------------  Modal Box Section  -------------------------------------*/}       
      <div>
        <Modal show={showModal} onHide={closeModal} backdrop="static">
          <Modal.Header closeButton>
            <Modal.Title>{modalTitle}</Modal.Title>
          </Modal.Header>
          <Modal.Body>{message}</Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={() => handleResponse(buttonType,'pressed1')}>{button1}</Button>
            {button2 && <Button variant="secondary" onClick={() => handleResponse(buttonType,'pressed2')}>{button2}</Button>}
          </Modal.Footer>
        </Modal>
      </div>

    </div>  /* End MAIN div */
  );
};

export default AdminApp;