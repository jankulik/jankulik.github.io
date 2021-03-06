var date = new Date;

var converter = new showdown.Converter();
converter.setOption('simplifiedAutoLink', true);
converter.setOption('tables', true);
converter.setOption('ghMentions', true);
converter.setOption('ghMentionsLink', 'https://steemit.com/@{u}');
converter.setOption('simpleLineBreaks', true);

var querystring = location.search;
var parentAuthor = querystring.split('/')[0];
parentAuthor = parentAuthor.slice(1, parentAuthor.length);
var parentPermlink = querystring.split('/')[1];

var token;
var expiresIn;
var username;

var slider = document.getElementById("myRange");
var output = document.getElementById("demo");
output.innerHTML = '$' + slider.value/10;
var sliderValue = 0;

document.getElementById("submitPrediction").innerHTML = '<span class="pager"> <li class="next"> <a href="#" onclick={makeGuess();return(false);}> Submit your guess </a> </li> </span>';
document.getElementById("reply").innerHTML = '<div id="reply/' + parentAuthor + '/' + parentPermlink + '"> </div>';
document.getElementById("comments").innerHTML = '<div id="' + parentPermlink + '"> </div>';
getReplies(parentAuthor, parentPermlink);

var api = sc2.Initialize({
	app: 'dcontest',
	callbackURL: 'https://dcontest.org',
	accessToken: 'access_token',
	scope: ['vote', 'comment']
});
var authorizationLink = 'https://steemconnect.com/oauth2/authorize?client_id=dcontest&redirect_uri=https%3A%2F%2Fdcontest.org&scope=vote,comment';


if(localStorage.query != null)
{
	if((date.getTime() - localStorage.time) / 1000 < 604000)
	{
		decodeQuery();
		document.getElementById("menu1").innerHTML = '<a href="https://steemit.com/@' + username + '">' + username + '</a>';
		document.getElementById("menu2").innerHTML = '<a href="https://dcontest.org" onclick="logOut()"> Log out </a>';

		if(username == 'dcontest')
			document.getElementById("editor").innerHTML = '<a href="https://dcontest.org/editor.html"> Editor </a>';
	}

	else
		logOut();
}

if(localStorage.query == null)
{
	document.getElementById("menu1").innerHTML = '<a href=' + authorizationLink + '> Log In </a>';
	document.getElementById("menu2").innerHTML = '<a href="https://signup.steemit.com"> Register </a>';
}

function loadPost(voting, voted)
{
	steem.api.getContent(parentAuthor, parentPermlink, function(err, content)
	{
		if(parentAuthor !== 'dcontest')
			document.getElementById("slider").style.display = "none";

		var title = content.title;
		if(content.json_metadata !== '')
		{
			if(JSON.parse(content.json_metadata).meta_title !== undefined)
				title = JSON.parse(content.json_metadata).meta_title;
		}

		var body = content.body;
		if(content.json_metadata !== '')
		{
			if(JSON.parse(content.json_metadata).meta_body !== undefined)
				body = JSON.parse(content.json_metadata).meta_body;
		}

		var html = converter.makeHtml(body);
		var splitted = html.split(' ');
		console.log(splitted);

		var image = '<img src="img/upvote.png" alt="upvote image" width="20" height="20">';
		for(var i = 0; i < content.active_votes.length; i++)
		{
			if(content.active_votes[i].voter == username)
			{
				image = '<img src="img/upvoted.png" alt="upvoted image" width="20" height="20">';
			}
		}
		if (voting == true) image = '<img src="img/loading.gif" alt="upvoted image" width="20" height="20">';
		if(voted == true) image = '<img src="img/upvoted.png" alt="upvoted image" width="20" height="20">';

		var payout;
		if(content.last_payout[0] == '1')
			payout = (parseFloat(content.pending_payout_value.split(' ')[0])).toFixed(2);
		else
			payout = (parseFloat(content.total_payout_value.split(' ')[0]) + parseFloat(content.curator_payout_value.split(' ')[0])).toFixed(2);

		var comments = content.children;
		var votes = content.active_votes.length;
		var payoutPayload = '<a href="#" onclick={loadPost(true,false);vote();return(false);} style="text-decoration:none">' + image + '</a>' + '&nbsp;' + votes + '&emsp;' + '$' + payout + '&emsp;' + '<img src="img/chat.png" alt="chat image" align="middle" width="17" height="19">' + ' ' + comments + '&emsp;' + '<a href="#" onclick={makeComment("' + parentAuthor + '","' + parentPermlink + '",false);return(false);} style="text-decoration:none"> Reply </a>';

		var date = new Date(content.created);
		var day = date.getDate();
		var month;
		var year = date.getFullYear();

		switch(date.getMonth())
		{
			case 0:
				month = "January"; break;
			case 1:
				month = "February"; break;
			case 2:
				month = "March"; break;
			case 3:
				month = "April"; break;
			case 4:
				month = "May"; break;
			case 5:
				month = "June"; break;
			case 6:
				month = "July"; break;
			case 7:
				month = "August"; break;
			case 8:
				month = "September"; break;
			case 9:
				month = "October"; break;
			case 10:
				month = "November"; break;
			case 11:
				month = "December"; break;
		}

		var url = 'https://steemit.com/@' + parentAuthor;
		var meta = 'Posted by <a href=' + url + '> @' + parentAuthor + '</a> on ' + month + ' ' + day + ',' + ' ' + year;

		html = html.replace(/blush/g, "😊");
		html = html.replace(/smiley/g, "😃");

		document.getElementById("title").innerHTML = title;
		document.getElementById("meta").innerHTML = meta;
		document.getElementById("body").innerHTML = html;
		document.getElementById("payout").innerHTML = payoutPayload;
	});
}

function makeComment(author, permlink, cancel)
{
	if(cancel == false)
	{
		document.getElementById('reply/' + author + '/' + permlink).innerHTML = `
		<textarea id="text/${author}/${permlink}" placeholder="Write something..."></textarea>
		<div>
			<span style="float: right;margin-left: 15px;margin-top: 12px;"> <a href="#" onclick={makeComment("${author}","${permlink}",true);return(false);} style="text-decoration:none"> Cancel </a> </span>
			<span id="button/${author}/${permlink}" class="pager"> <li class="next"> <a href="#" onclick={submitComment("${author}","${permlink}");return(false);}> Submit </a> </li> </span>
		</div>`;
	}
	else
	{
		document.getElementById('reply/' + author + '/' + permlink).innerHTML = '';
	}
}

function submitComment(author, permlink)
{
	document.getElementById('button/' + author + '/' + permlink).innerHTML = '<img src="img/loading.gif" style="float: right;margin-top: 15px;" alt="loading image" width="20" height="20">';

	if(localStorage.query != null)
	{
		var body = document.getElementById('text/' + author + '/' + permlink).value;

		var childPermlink = steem.formatter.commentPermlink(author, permlink);
		api.comment(author, permlink, username, childPermlink, '', body, {"app":"dcontest"}, function (err, result)
		{
			if(err)
	    		alert('Something went wrong.');

			else
			{
		  		makeComment(author, permlink, true);
		  		getReplies(author, permlink);
		  	}
		});
	}

	else
		alert('You are not logged in!');
}

function decodeQuery()
{
    var parameters = localStorage.query.split('&');
    for (var i = 0; i < parameters.length; i++)
    {
        var pair = parameters[i].split('=');
        
        switch(pair[0])
		{
		    case 'access_token':
		    	token = pair[1]; break;
		    case 'expires_in':
		    	expiresIn = pair[1]; break;
		    case 'username':
		    	username = pair[1]; break;
		}
    }

    api.setAccessToken(token);
}

function logOut()
{
	api.revokeToken(function (err, result)
	{
  		console.log(err, result);
	});

	localStorage.removeItem("query");
	localStorage.removeItem("time");
}

function vote()
{
	if(localStorage.query != null)
	{
		api.vote(username, parentAuthor, parentPermlink, 10000, function (err, result)
		{
	    	if(err)
	    		alert('Something went wrong.');

	    	else
				loadPost(false, true);
		});
	}

	else
		alert('You are not logged in!');
}

function voteComment(author, permlink)
{
	if(localStorage.query != null)
	{
		api.vote(username, author, permlink, 10000, function (err, result)
		{
			if(err)
				alert('Something went wrong.');

	    	else
	    		commentMeta(author, permlink, false);
		});
	}

	else
		alert('You are not logged in!');
}

slider.oninput = function()
{
  output.innerHTML = '$' + this.value/10;
  sliderValue = '$' + this.value/10;
}

function makeGuess()
{
	document.getElementById("submitPrediction").innerHTML = '<img style="float: right;margin-top: 10px;" src="img/loading.gif" alt="upvoted image" width="20" height="20">';

	if(localStorage.query != null)
	{
		var childPermlink = steem.formatter.commentPermlink(parentAuthor, parentPermlink);
		api.comment(parentAuthor, parentPermlink, username, childPermlink, '', sliderValue, {"app":"dcontest"}, function (err, result)
		{
			if(err)
				alert('Something went wrong.');

			else
				document.getElementById("slider").innerHTML = '<div style="margin-top: 80px;font-weight: bold;text-align: right;"> Your prediction has been successfully submitted. </div>';
		});
	}

	else
		alert('You are not logged in!');
}

function renderComment(comment, profileImage)
{
	var id = comment.id;
	var author = comment.author;
	var reputation = Math.round(((Math.log10(comment.author_reputation) - 9) * 9) + 25);
	var permlink = comment.permlink;
	var body = converter.makeHtml(comment.body);

	var metadata = '';
	if(comment.json_metadata !== '')
		metadata = JSON.parse(comment.json_metadata);

	var dapp = '';
	if(metadata.app == 'dcontest')
		dapp = '<img src="img/dapp.png" alt="image" style="width:108px;height:20px;">';

	var commentHtml = `
			<li style="max-width:600px;">
				<img src="${profileImage}" class="profile-image" alt="image" style="width:50px;height:50px;">

			 	<div class="comment-header">
					<a style="font-weight: bold;" href="https://steemit.com/@${author}"> ${author} </a>
					<span> (${reputation}) &emsp; </span>
					${dapp}
				</div> 

				<div class="comment-content">
					${body}
				</div>
				<div id="${author + '/' + permlink}" class="comment-meta"> </div>
				<div id="${'reply/' + author + '/' + permlink}" style="margin-top: 15px;margin-left: 60px;"> </div>
				<hr>
				<ul id=${permlink}> </ul>
			</li>`;

	return commentHtml;
}

function getReplies(author, permlink)
{
	steem.api.getContentReplies(author, permlink, function(err, result)
	{
		var authors = [];
		for(var i = 0; i < result.length; i++)
			authors.push(result[i].author);
	
		steem.api.getAccounts(authors, function(err, accounts)
		{
			var comments = '';
			for(var i = 0; i < result.length; i++)
			{
				var image = '';
				if(accounts[i].json_metadata !== '')
				{
					if(JSON.parse(accounts[i].json_metadata).profile !== undefined)
					{
						if(JSON.parse(accounts[i].json_metadata).profile.profile_image !== undefined)
							image = JSON.parse(accounts[i].json_metadata).profile.profile_image;
						else
							image = 'img/profile_image.png';
					}
					else
						image = 'img/profile_image.png';
				}
				else
					image = 'img/profile_image.png';

				comments += renderComment(result[i], image);
			}

			document.getElementById(permlink).innerHTML = comments;

			for(var i = 0; i < result.length; i++)
			{
				commentMeta(result[i].author, result[i].permlink, false);
			}

			for(var i = 0; i < result.length; i++)
			{
				if(result[i].children > 0)
				{
					getReplies(result[i].author, result[i].permlink);
				}
			}
		});
	});
}

function commentMeta(author, permlink, voting)
{
	steem.api.getContent(author, permlink, function(err, content)
	{
		var last_payout = content.last_payout;
		var pending_payout_value = content.pending_payout_value;
		var total_payout_value = content.total_payout_value;
		var curator_payout_value = content.curator_payout_value;

		var image = '<img src="img/upvote.png" alt="upvote image" width="20" height="20">';
		for(var i = 0; i < content.active_votes.length; i++)
		{
			if(content.active_votes[i].voter == username)
				image = '<img src="img/upvoted.png" alt="upvoted image" width="20" height="20">';
		}
		if (voting == true) image = '<img src="img/loading.gif" alt="upvoted image" width="20" height="20">';

		var votes = content.active_votes.length;

		var payout;
		if(content.last_payout[0] == '1')
			payout = (parseFloat(content.pending_payout_value.split(' ')[0])).toFixed(2);
		else
			payout = (parseFloat(content.total_payout_value.split(' ')[0]) + parseFloat(content.curator_payout_value.split(' ')[0])).toFixed(2);

		var payoutPayload = '<a href="#" onclick={commentMeta("' + author + '","' + permlink + '",true);voteComment("' + author + '","' + permlink + '");return(false);} style="text-decoration:none">' + image + '</a>' + '&nbsp;' + votes + '&emsp;' + '$' + payout + '&emsp;' + '<a href="#" onclick={makeComment("' + author + '","' + permlink + '",false);return(false);} style="text-decoration:none"> Reply </a>';

		document.getElementById(author + '/' + permlink).innerHTML = payoutPayload;
	});
}