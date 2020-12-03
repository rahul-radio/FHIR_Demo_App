//adapted from the cerner smart on fhir guide. updated to utalize client.js v2 library and FHIR R4

//create a fhir client based on the sandbox enviroment and test paitnet.
var age;
var gender;
var activitylevel = document.getElementById('ActivityLevel').value
var goal = document.getElementById('goal').value
var goal_weight = document.getElementById('goal_weight').value
var weight_number;

const client = new FHIR.client({
  serverUrl: "https://r4.smarthealthit.org",
  tokenResponse: {
    // patient: "fc200fa2-12c9-4276-ba4a-e0601d424e55"
    patient: "494743a2-fea5-4827-8f02-c2b91e4a4c9e"
    // patient: "326b4675-0bc8-4dbd-b406-a5564c282401"
    // patient: "87a339d0-8cae-418e-89c7-8651e6aab3c6"
    // patient: "ffd502c9-23e1-4f8f-bc8a-87373acad280"
    
  }
});

function validateForm(goal, current_weight) {
  var goal_weight = document.getElementById('goal_weight').value

  if (goal == 0) {
    if (goal_weight != Math.round(current_weight)) {
      alert("Goal Weight must be equal to Current weight")
      return false;
    } else {
      return true;
    }
  } else if (goal == .95) {
    //Code Credit: https://stackoverflow.com/questions/43015921/checking-if-input-is-integer-using-javascript
    if (Number.isInteger(+goal_weight)) {
      if(parseFloat(goal_weight) > parseFloat(current_weight)) {
        alert("Goal Weight must be less than Current Weight");
        return false
      } else {
        console.log(current_weight)
        console.log(goal_weight)
        return true;
      }
    } else {
      alert("Please Enter Only Digits");
      return false;
    }
  } else if (goal == 1.05) {
    if (Number.isInteger(+goal_weight)) {
      //Code Credit: https://stackoverflow.com/questions/43015921/checking-if-input-is-integer-using-javascript
      if(parseFloat(goal_weight) < parseFloat(current_weight)) {
        alert("Goal Weight must be Greater than Current Weight");
        return false
      } else {
        return true;
      }
    } else {
      alert("Please Enter Only Digits");
      return false;
    }
  } else {
      return true;
  }
}

// helper function to process fhir resource to get the patient name.
function getPatientName(pt) {
  if (pt.name) {
    var names = pt.name.map(function(name) {
      return name.given.join(" ") + " " + name.family;
    });
    return names.join(" / ")
  } else {
    return "anonymous";
  }
}

// display the patient name gender and dob in the index page
function displayPatient(pt) {
  document.getElementById('patient_name').innerHTML = getPatientName(pt);
  document.getElementById('gender').innerHTML = pt.gender.charAt(0).toUpperCase() + pt.gender.slice(1);
  document.getElementById('age').innerHTML = getAge(pt);
  age = getAge(pt);
  gender = pt.gender;
}

//helper function to display the annotation on the index page
function displayAnnotation(annotation) {
  note.innerHTML = annotation;
}

//helper function to display the annotation on the index page
function fillAnnotation(goal,activitylevel, goal_weight) {
  var goal_str;
  var activitylevel_str;
  var preFill_annotation;

  if (goal == 0) {
    goal_str = "Maintain Weight"
  } else if (goal == .95) {
    goal_str = "Slowly Lose Weight"
  } else {
    goal_str = "Slowly Gain Muscle"
  }

  if (activitylevel == 1.2) {
    activitylevel_str = "Sedentary"
  } else if (activitylevel == 1.375) {
    activitylevel_str= "Lightly Active"
  } else if (activitylevel == 1.55) {
    activitylevel_str= "Moderately Active"
  } else if (activitylevel == 1.725) {
    activitylevel_str= "Very Active"
  } else {
    activitylevel_str = "Extremely Active"
  }

  preFill_annotation = "Patient's goal is to: " + goal_str + " and they describe themselves as: " + activitylevel_str + ". Goal Weight is " + goal_weight;
  
  saveNoteModaltext.innerHTML = preFill_annotation;

}

//helper function to get quanity and unit from an observation resoruce.
function getQuantityValueAndUnit(ob) {
  if (typeof ob != 'undefined' &&
    typeof ob.valueQuantity != 'undefined' &&
    typeof ob.valueQuantity.value != 'undefined' &&
    typeof ob.valueQuantity.unit != 'undefined') {
    return Number(parseFloat((ob.valueQuantity.value)).toFixed(2)) + ' ' + ob.valueQuantity.unit;
  } else {
    return undefined;
  }
}

function getAge(patient) {
  var currentYear = new Date;
  return currentYear.getFullYear().toString()-patient.birthDate.substring(0,4)
}

// create a patient object to initalize the patient
function defaultPatient() {
  return {
    height: {
      value: ''
    },
    weight: {
      value: ''
    },
    age: {
      value: ''
    },
    bmr: {
      value: ''
    },
    tdee: {
      value: ''
    },
    totalCalories: {
      value: ''
    },
    protein: {
      value: ''
    },
    carb: {
      value: ''
    },
    fat: {
      value: ''
    },
    note: 'No Annotation',
  };
}

//function to display the observation values you will need to update this
function displayObservation(obs) {
  height.innerHTML = obs.height;
  weight.innerHTML = Math.round(obs.weight.substring(0,obs.weight.indexOf(' '))) + " Kg";
  bmr.innerHTML = obs.bmr + " Calories";
  tdee.innerHTML = obs.tdee + " Calories";
  protein.innerHTML = obs.protein + " Grams";
  carb.innerHTML = obs.carb + " Grams";
  fat.innerHTML = obs.fat + " Grams";
  totalCalories.innerHTML = obs.totalCalories + " Calories";
  time.innerHTML = obs.week_to_weight + " Weeks"
}

function displayCondition(condition) {
  diabetes.innerHTML = condition;
}

// get patient object and then display its demographics info in the banner
client.request(`Patient/${client.patient.id}`).then(
  function(patient) {
    displayPatient(patient);
  }
);

// get observation resoruce values
// you will need to update the below to retrive the weight and height values
var query = new URLSearchParams();

query.set("patient", client.patient.id);
query.set("_count", 100);
query.set("_sort", "-date");
query.set("code", [
  'http://loinc.org|29463-7',
  'http://loinc.org|8302-2',
  'http://loinc.org|2339-0'
].join(","));

client.request("Observation?" + query, {
  pageLimit: 0,
  flat: true
}).then(
  function(ob) {
    // group all of the observation resoruces by type into their own
    var byCodes = client.byCodes(ob, 'code');
    var weight = byCodes('29463-7');
    var height = byCodes('8302-2');
    var insulin = byCodes('2339-0');
    
    // create patient object
    var p = defaultPatient();

    p.weight = getQuantityValueAndUnit(weight[0]);
    p.height = getQuantityValueAndUnit(height[0]);
    weight_number = p.weight.substring(0,p.weight.indexOf(' '));
    var height_number = p.height.substring(0,p.height.indexOf(' '));
   
    if ((p.weight.substring(p.weight.indexOf(' ')).toLowerCase() != " kg")) {
      weight_number = weight_number/2.2;
    } 

    p.bmr = Math.round(calcBMR(weight_number, height_number));
    p.tdee = Math.round(calcTDEE(p.bmr))
    p.totalCalories = Math.round(consumeCalories(p.tdee, goal));
    var macros = calcMacros(p.tdee, p.weight, goal);
    p.protein = Math.round(macros[0])
    p.carb = Math.round(macros[1])
    p.fat = Math.round(macros[2])
    // Calulate time to goal weight
    if (document.getElementById('goal_weight').value == 'undefined') {
      goal_weight = weight_number
    }
    p.week_to_weight = calcGoalWeightTime(weight_number, goal_weight, goal)
    displayObservation(p)

    //Get last note
    if (typeof weight[0].note != 'undefined') {
      var last_annotation = weight[0].note.length-1
      displayAnnotation(weight[0].note[last_annotation].text + ". Added On " + weight[0].note[last_annotation].time); 
    } else {
      displayAnnotation("No Previous Note"); 
    }

    // Display the Weight Chart
    chartWeight(weight)
    chartGlucose(insulin)
  });

var query2 = new URLSearchParams();

query2.set("patient", client.patient.id);
query2.set("code", [
  'http://snomed.info/sct|44054006', // diabetes
  'http://snomed.info/sct|15777000' // prediabetes
].join(","));

  client.request("Condition?" + query2, {
    pageLimit: 0,
    flat: true
  }).then(
    function(condition) {
      // var byCodes = client.byCodes(condition, 'code');
      for (i=0; i<condition.length; i++) { 
        if (condition[i].code.coding[0].code == 44054006) {
          var diabetes = true;
        }
        else if (condition[i].code.coding[0].code == 15777000) {
          var prediabetes = true;
        }
      }

      if (diabetes == true) {
        displayCondition("Diabetic")
      }
      else if(prediabetes == true) {
        displayCondition("Pre-Diabetic")
      }
      else{
        displayCondition("Not Pre-Diabetic")
      }

    }
  )

function calcBMR(weight, height) {
  // There are 2 formulae used to calculate BMR, in [kcal / 24hrs] for men and women respectively:
  if (gender.toString() == "male") {
    return 66.47 + (13.75 * weight) + (5.003 * height) - (6.755 * age)
  } 
  return 655.1 + (9.563 * weight) + (1.85 * height) - (4.676 * age)
}

function calcTDEE(bmr){
  return bmr * activitylevel
  // Sedentary (little to no exercise + work a desk job) = 1.2
  // Lightly Active (light exercise 1-3 days / week) = 1.375
  // Moderately Active (moderate exercise 3-5 days / week) = 1.55
  // Very Active (heavy exercise 6-7 days / week) = 1.725
  // Extremely Active (very heavy exercise, hard labor job, training 2x / day) = 1.9
}

function consumeCalories(tdee, goal) {
  if (goal == 0) {
    return tdee;
  }
  return tdee * goal;
}

function calcMacros(tdee, weight, goal) {
  var protein = 0;
  var carbs = 0;
  var fats = 0;
  var weight_number = weight.substring(0,weight.indexOf(' '));
  if (goal == 0) {
    var totalCalories = tdee;
    var macroCalculator = tdee;
    protein = Math.round(weight_number  * 2.2);
  }
  else{
    var totalCalories= tdee * goal;
    var macroCalculator = tdee * goal;
    protein = Math.round(weight_number * 2.2);
  }

  macroCalculator = totalCalories - (protein * 4);
  macroCalculator = macroCalculator/2;

  carbs = macroCalculator/4;
  fats = macroCalculator/9;

  var protein_percent = Math.round((protein*4 / totalCalories) * 100);
  var carb_percent = Math.round((carbs*4 / totalCalories) * 100);
  var fat_percent = Math.round((fats*9 / totalCalories) * 100);

  var ctx = document.getElementById('macro_chart');
  var macro_chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
          labels: ['Protein', 'Carbs', 'Fat'],
          datasets: [{
              label: 'Percent of Total Calories',
              data: [protein_percent, carb_percent, fat_percent],
              backgroundColor: [
                  'rgba(255, 99, 132, 0.2)',
                  'rgba(54, 162, 235, 0.2)',
                  'rgba(255, 206, 86, 0.2)'
              ],
              borderColor: [
                  'rgba(255, 99, 132, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)'
              ],
              borderWidth: 1
          }]
      },
      options: {

      }
  });

  return [protein,carbs,fats];

}

function chartWeight(weight){

  var weight_obs = []
  var date = []
  for (i=0; i<weight.length; i++) {
    weight_obs.push(Math.round(weight[i].valueQuantity.value))
    date.push(weight[i].effectiveDateTime.substring(0,10))
  }

  var ctx = document.getElementById('weight_chart').getContext('2d');
  var weight_chart = new Chart(ctx, {
        type: 'line',
        // The data for our dataset
        data: {
            labels:date.reverse(),
            datasets: [{
                label: "Weight Observations",
                // backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: weight_obs.reverse(),
            }]
        },

        // Configuration options go here
        options: {}
    });
}

function chartGlucose(glucose) {

  var glucose_obs = []
  var date = []
  for (i=0; i<glucose.length; i++) {
    glucose_obs.push(Math.round(glucose[i].valueQuantity.value))
    date.push(glucose[i].effectiveDateTime.substring(0,10))
  }

  var ctx = document.getElementById('glucose_chart').getContext('2d');
  var glucose_chart = new Chart(ctx, {
        type: 'line',
        // The data for our dataset
        data: {
            labels:date.reverse(),
            datasets: [{
                label: "Glucose Observations",
                // backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: glucose_obs.reverse(),
            }]
        },
        // Configuration options go here
        options: {}
    });
  
}

function updateGoal_Activity(){
  activitylevel = document.getElementById('ActivityLevel').value
  goal = document.getElementById('goal').value
  var validate = validateForm(goal, weight_number)  
  if (validate == true) {
    location.reload()
  }
}

function addWeight() {
  var dt = new Date();
  var new_weight = document.getElementById('new_weight').value

  if (Number.isInteger(+new_weight) != true) {
      alert("Weight must be an Integer");
      return false
  } 

  var entry = {
    resourceType: 'Observation',
    code: {coding: [{system: 'http://loinc.org', code: '29463-7', display: 'Weight'}]},
    status: "final",
    valueQuantity: {value: new_weight, unit: 'kg', code: 'kg'},
    subject: {reference: 'Patient/' + client.patient.id},
    effectiveDateTime: dt
  }
  client.create(entry).then(
    function reloadPage() {
      setTimeout(location.reload.bind(location), 6000);
      location.reload()
    }
    
  )
}

function addGlucose() {
  var dt = new Date();
  var new_glucose = document.getElementById('new_glucose').value

  if (Number.isInteger(+new_glucose) != true) {
    alert("Weight must be an Integer");
    return false
  }

  var entry = {
    resourceType: 'Observation',
    code: {coding: [{system: 'http://loinc.org', code: '2339-0', display: 'Glucose'}]},
    valueQuantity: {value: new_glucose, unit: 'mg/dL', code: 'mg/dL'},
    subject: {reference: 'Patient/' + client.patient.id},
    effectiveDateTime: dt
  }
  client.create(entry).then(
    function reloadPage(ob) {
      console.log(ob)
      // setTimeout(location.reload.bind(location), 6000);
      location.reload()
    })
}

function calcGoalWeightTime(current_weight, goal_weight, goal){
  //Maintain weight = +- 0.0 KG per week
  // Slowly lose weight = -0.2 Kg per week
  // Slowly Build Muscle = + 0.2 Kg per week
  var weeks_to_goal = 0;
  if (goal == 0) {
    return weeks_to_goal
  }

  var diff = Math.abs(current_weight - goal_weight)
  return Math.round(diff/.2)
}

function addWeightAnnotation() {
  var annotation = document.getElementById('saveNoteModaltext').value
  var annotation_author = "Dr. Mario"
  var date = new Date;
  var query = new URLSearchParams();

  query.set("patient", client.patient.id);
  query.set("_count", 100);
  query.set("_sort", "-date");
  query.set("code", [
    'http://loinc.org|29463-7',
  ].join(","));

  client.request("Observation?" + query, {
    pageLimit: 0,
    flat: true
  }).then(
    function(ob) {
      var byCodes = client.byCodes(ob, 'code');
      var weight = byCodes('29463-7');
      console.log(weight)
      var obs_id = ob[0].id;

      if (typeof weight[0].note == 'undefined') {
        weight[0]['note'] = [];
      }

      var weight_observation_update = weight[0]

      var annotation_body = { 
        "authorString": annotation_author,
        "time" : date.toISOString(),
        "text" : annotation
      }

      weight_observation_update.note.push(annotation_body);

      client.request(Object.assign({}, {
        url: "Observation/" + obs_id,
        method: "PUT",
        body: JSON.stringify(weight_observation_update),
        headers: Object.assign({"Content-Type": "application/json"})
        }
      
      )
      )});

  displayAnnotation(annotation  + " on date: " + date.getMonth() + "/" + date.getDate() + "/" + date.getFullYear());
}

//event listner when the add button is clicked to call the function that will add the note to the weight observation
document.getElementById('ActivityLevel').addEventListener('click', calcTDEE);
document.getElementById('savenote').addEventListener('click', addWeightAnnotation);
document.getElementById('openNewNote').addEventListener('click', fillAnnotation(document.getElementById('goal').value, document.getElementById('ActivityLevel').value, document.getElementById('goal_weight').value));