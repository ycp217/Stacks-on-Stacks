/*===================================================================
---------------------------------------------------------------------
* GET FROM THE STORAGE
-
This checks whether individual data tables exist, and if they don't,
it will create the data table for you. 
---------------------------------------------------------------------
===================================================================*/

/*-------------------------------------------------------------------
********* GET PROJECTS
Load in each of our projects. This will give us the dividers that
our questions will get appended to.
-------------------------------------------------------------------*/
function getProjects() {
	return chrome.storage.local.get(null, function(items) {
		if (!chrome.runtime.error) {
			// We want the appended stars to be unfilled
			var filled = false;

			// Iterate through the projects in the storage
			for (var i = 0; i < items.projects.length; i++) {
				var name =  JSON.stringify(items.projects[i].name);

				// If it's the first project being loaded, then it is the 'Unsorted' project, and we want that to be first.
				if (i === 0) {
					$('<div class="project"><div class="projectHeader"><p class="projectTitle addIcons"><input class="newproject" value=' + name + ' disabled></p></div><div class="questions"></div></div><div class="answers"></div>')
						.insertAfter("#helpInsertProjects")
						.ready(function() {
							// Do these when the project loads in.
							colorHeaders();
							addUnsortedEmpty(i); // add emptyUnsorted icon
							addStar(i, filled); // add star icon
						})
				} else {
					// Load all of the projects that aren't 'Unsorted' in a slightly different manner

					// Place the project after the current last project
					var placing = $(".project").eq($(".project").length - 1);

					$('<div class="project"><div class="projectHeader"><p class="projectTitle addIcons"><input class="newproject" value=' + name + ' disabled></p></div><div class="questions"></div></div><div class="answers"></div>')
						.insertAfter(placing)
						.ready(function() {
							// Do these when the project loads in.
							colorHeaders();
							addEmpty(i); // add emptyUnsorted icon
							addStar(i, filled); // add star icon
						})
				}
			}

			showDefaultProject(); // visually represent the current place links are added to

			// When you double click on a project header, it will hide the questions
			$(".projectHeader").dblclick(function() {
				$(this).next().toggle(0);
			});
		} else {
			console.log("Welps. I failed to get all of the projects you requested.");
		}
	});
}

/*-------------------------------------------------------------------
********* GET QUESTIONS
Load in the questions for each of our projects.
-------------------------------------------------------------------*/
function getAllLinks() {
	return chrome.storage.local.get(null, function(items) {
		if(!chrome.runtime.error) {
			// Keep track of the total number of questions
			var onThisQuestion = 0;

			// Iterate through the projects
			for (var i = 0; i < items.projects.length; i++) {

				// Iterate through the questions
				for (var j = 0; j < items.projects[i].questions.length; j++, onThisQuestion++) {

					/////////////// DATA INPUT PREPARATION
					// Prepare the data that we'll display to the user.
					var question = items.projects[i].questions[j].question;
					var link = JSON.stringify(items.projects[i].questions[j].link);
					var answer = items.projects[i].questions[j].answer;
					var upvotes = items.projects[i].questions[j].upvotes;

					/////////////// DISPLAY THE DATA TO THE USER
					// Create the dividers to display the data.

					(function(i, j, onThisQuestion, question, link) {
						$('<div class="question" id="question' + i + "_" + j +'"></div>')
							.appendTo(document.getElementsByClassName('questions')[i]);

						$('<div class="title" id="title' + i + "_" + j + '"><p class="questionTitle">' + question + '</p><a target="_blank" href=' + link + '><img src="images/go.svg" class="icon goToIcon"></a></div>')
							.appendTo(document.getElementById('question' + i + "_" + j))
							.click(function() {
								$(this).next().toggle(0);
							});

						$('<div class="answer" id="answer' + i + j +'"><center><p class="answerText">' + answer + '</p><p class="upvotes">+' + upvotes +'</p></center></div>')
							.insertAfter($("#title" + i + "_" + j));

						$(".upvotes")
							.eq(onThisQuestion)
							.css({
								"top": 0,
								"right": "5px"
							});


						$('<img src="/images/delete.svg" class="icon deleteIcon"></div>')
							.appendTo(document.getElementsByClassName('title')[onThisQuestion]).click(function() {
								var deleteTest;
								chrome.storage.local.get(null, function(item) { 
									$("#question" + i + "_" + j).remove();
									deleteLink(link, i);
								});
							});          
					}(i, j, onThisQuestion, question, link));
				}
			}

			//Add open in new tab property to every <a>
			var links = $("a");
			for (var i = 0; i < links.length; i++) {
				$("a").eq(i).attr("target", "_blank");
			}

			//get rid of empty <p> tags
			$("p").each(function() {
				if ($(this).html().replace(/\s|&nbsp;/g, '').length === 0) {
					$(this).remove();
				}
			});


			// TRY TO FORMAT CODE

			// Need to include this code snippet, otherwise it'll also edit stackoverflow's divs
			var currentURL = window.location.href.toString();
			if (!(currentURL.indexOf("stackoverflow") >= 0)) {

				// If there is a comment on a line by itself, then add a line break before it to show this
				for (var i = 0; i < $(".com").length; i++) {
					if ( ($(".com").eq(i).prev().html() === "") ) {
						$("<br>").insertBefore($(".com").eq(i));
					}
					if ( ($(".com").eq(i).prev().html() === "  ") ) {
						$("<br>").insertBefore($(".com").eq(i));
					}
				}

				for (var i = 0; i < $(".pun").length; i++) {
					// If ; then make a line break after it
					if ( ($(".pun").eq(i).text().indexOf(";") > -1) && !($(".pun").eq(i).next().next().hasClass("com")) && !($(".pun").eq(i).prev().is("br")) ) {
						$("<br>").insertAfter($(".pun").eq(i));
					}
				}

				for (var i = 0; i < $(".pln").length; i++) {
					// // If there's a comment before the pln, add another line break
					// if ($(".pln").eq(i).prev().hasClass("com")) {
					// 	$("<br>").insertBefore($(".pln").eq(i))
					// }

					// If there's an empty pln, add another line break
					if ( ($(".pln").eq(i).html() === "") && !($(".pln").eq(i).prev().is("br")) ) {
						$("<br>").insertAfter($(".pln").eq(i))
					}

					// Put a line break before 'tab's, because that's usually indicates a new line
					if ( ($(".pln").eq(i).html() === "  ") && !($(".pln").eq(i).prev().hasClass("com")) ) {
						$("<br>").insertBefore($(".pln").eq(i));
					}

					// Check whether the span contains a tab; if it does, put a line break before it
					if (($(".pln").eq(i).html().indexOf("    ") > -1) && !($(".pln").eq(i).prev().is("br")) ) {
						$("<br>").insertBefore($(".pln").eq(i))
					}
				}
			}
		}
	});
}
