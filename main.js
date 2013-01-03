/**
 * Orgchart3 - main.js
 * @author daPhyre
 * @since 0.1, We/22/feb/12
 * @version 1.0, We 14/mar/12
 */
var canvas=null,ctx=null;
var DEBUG=false;
var maxDepth=0;
var data=null,selected=null;

window.addEventListener('load',init,false);
function $(id){return document.getElementById(id);}
function errorHandler(e){if(window.console)console.error(e);}
CanvasRenderingContext2D.prototype.strokeLine=function(x1,y1,x2,y2){this.beginPath();this.moveTo(x1,y1);this.lineTo(x2,y2);this.stroke()}

/* INIT & NEW */
function init(){
	hideOpenfileBox();
	$('addSon').disabled=true;
	$('addSiblingL').disabled=true;
	$('addSiblingR').disabled=true;
	$('deleteChild').disabled=true;
	canvas=document.getElementById('canvas-app');
	ctx=canvas.getContext('2d');
	canvas.addEventListener('click',Click,false);
	canvas.addEventListener('dblclick',DblClick,false);
	canvas.addEventListener('mousedown',MouseDown,false);
	var dropzone=document.getElementsByTagName('html')[0];
	dropzone.addEventListener('dragenter',DragStopper,false);
	dropzone.addEventListener('dragover',DragStopper,false);
	dropzone.addEventListener('drop',Drop,false);

	if(DEBUG)canvas.style.outline='#ccc dotted 1px';	
	if(localStorage.data)
		text2chart(localStorage.data);
	else
		data=new Tag('[Double click to set name]');
	repaint();
}

function newTree(){
	if(confirm('WARNING: This will delete your current tree')){
		data=new Tag('[Double click to set name]');
		repaint();
	}
}

/* DRAG & DROP */
function DragStopper(e){
	e.preventDefault();
	return false;
}

function Drop(e){
	e.preventDefault();
	var files=e.dataTransfer.files;
	if(files.length>0)loadChart(files[0]);
}

/* BUTTONS */
function showOpenfileBox(){$('openfileBox').style.display='block'}
function hideOpenfileBox(){$('openfileBox').style.display='none'}

function addSon(){
	if(selected==null){
		alert('No object selected');
		return;
	}
	else{
		var title=prompt('Tag name:');
		if(title!=null){
			getChildById(selected).children.push(new Tag(title));
			repaint();
		}
	}
}

function addSibling(plus){
	if(selected==null){
		alert('No object selected');
		return;
	}
	else if(selected=='0'){
		alert('Root cannot have siblings');
		return;
	}
	else{
		plus=(plus==null)?0:plus;
		var title=prompt('Tag name:');
		if(title!=null){
			var id=selected.substr(0,selected.lastIndexOf('.'));
			var c=parseInt(selected.substr(selected.lastIndexOf('.')+1))+plus;
			getChildById(id).children.splice(c,0,new Tag(title));
			repaint();
		}
	}
}

function deleteChild(){
	if(selected==null){
		alert('No object selected');
		return;
	}
	else if(selected=='0'){
		alert('Root cannot be deleted');
		return;
	}
	else{
		var conf=confirm('Are you sure to delete this tag and all it\'s children?');
		if(conf){
			var id=selected.substr(0,selected.lastIndexOf('.'));
			var c=selected.substr(selected.lastIndexOf('.')+1);
			getChildById(id).children.splice(c,1);
			repaint();
		}
	}
}

function changeName(){
	if(selected==null){
		alert('No object selected');
		return;
	}
	else{
		var c=getChildById(selected)
		var title=prompt('Tag name:',c.title);
		if(title!=null){
			c.title=title;
			repaint();
		}
	}
}

/* SAVE & LOAD */
function loadChart(file){
	hideOpenfileBox();
	if(confirm('WARNING: This will delete your current tree')){
		var fr=new FileReader();
		fr.onerror=errorHandler;
		fr.onload=function(e){
			text2chart(e.target.result);
			if(window.console)console.log('Opened file: '+file.fileName);
		};
		fr.readAsText(file);
	}
}

function text2chart(str){
	str=str.split('\n');
	if(str[str.length-1]=='')str.pop();
	if(str.length){
		data=new Tag(str.shift());
		var d=data;
		var l=0;
		while(str.length){
			l=str[0].lastIndexOf('\t')+1;
			d.children.push(new Tag(str.shift().substr(l),d));
			if(str.length){
				var ln=str[0].lastIndexOf('\t')+1;
				if(l<ln)
					d=d.children[d.children.length-1];
				else if(l!=ln){
					while(l!=ln){
						d=d.parent;
						l--;
					}
				}
			}
		}
	}
	repaint();
}

function saveChart(){
	var str=saveLocal();
	if(window.saveAs){
		window.BlobBuilder=window.WebKitBlobBuilder||window.MozBlobBuilder||window.BlobBuilder;
		var bb=new BlobBuilder();
		bb.append(str) 
		var fs=window.saveAs(bb.getBlob(),data.title+'.oc3');
		fs.onwriteend=function(){
			if(window.console)console.log(data.title+'.oc3; '+str);
		}
	}
	else{
		if(window.console)console.error('SaveAs not supported by your browser.');
	}
}

function saveLocal(){
	var str=saveRecursive();
	localStorage.data=str;
	return str;
}

function saveRecursive(d,l){
	if(d==null)d=data;
	if(l==null)l=0;
	var str='';
	for(var i=0;i<l;i++)
		str+='\t'
	str+=d.title;
	if(d.children.length){
		for(var i=0;i<d.children.length;i++){
			str+='\n'+saveRecursive(d.children[i],l+1);
		}
	}
	return str;
}

/* EDIT CHILDREN */
function getChildById(id,d){
	if(id!=null){
		if(d==null)d=data;
		if(d.id==id)
			return d;
		else if(d.children.length){
			var c=null;
			for(var i=0;i<d.children.length;i++){
				var t=getChildById(id,d.children[i]);
				if(t!=null)
					c=t;
			}
			return c;
		}
		else
			return null;
	}
	else{
		if(window.console)console.error('ID missing in getChildById(id)');
		return null;
	}
}

function findChild(x,y,d){
	if(x>d.x&&x<d.x+d.width&&y>d.y&&y<d.y+24)
		return d.id;
	else if(d.children.length){
		var c=null;
		for(var i=0;i<d.children.length;i++){
			var t=findChild(x,y,d.children[i]);
			if(t!=null)
				c=t;
		}
		return c;
	}
	else
		return null;
}

function setChildren(d,l,x,pid){
	if(l==null)l=0;
	if(x==null)x=0;
	if(pid==null)d.id='0';
	else d.id=pid;
	d.x=x;
	d.y=60+l*60;
	d.width=ctx.measureText(d.title).width+20;
	d.contentWidth=0;
	if(d.children.length){
		for(var i=0;i<d.children.length;i++){
			var cw=d.x;
			for(var j=0;j<i;j++)
				cw+=d.children[j].contentWidth;
			d.contentWidth+=setChildren(d.children[i],l+1,cw,d.id+'.'+i);
		}
		if(d.contentWidth<d.width){
			var dx=(d.width-d.contentWidth)/2+5;
			addChildrenPadding(d,dx)
			d.contentWidth=d.width+10;
		}
		d.x+=(d.contentWidth-d.width)/2;
	}
	else{
		d.x+=5;
		d.contentWidth=d.width+10;
	}
	if(l!=0){
		if(l>maxDepth)
			maxDepth=l;
	}
	return d.contentWidth;
}

function addChildrenPadding(d,x){
	for(var i=0;i<d.children.length;i++){
		d.children[i].x+=x;
		if(d.children.length)
			addChildrenPadding(d.children[i],x)
	}
}

/* PAINT CANVAS */
function printChildren(d,l){
	if(l==null)l=0;
	if(d.children.length){
		for(var i=0;i<d.children.length;i++)
			printChildren(d.children[i],l+1);
		ctx.strokeLine(d.x+d.width/2,d.y+24,d.x+d.width/2,d.y+42);
		var lc=d.children.length-1;
		ctx.strokeLine(d.children[0].x+d.children[0].width/2,d.y+42,d.children[lc].x+d.children[lc].width/2,d.y+42);
	}
	if(l!=0){
		ctx.strokeLine(d.x+d.width/2,d.y-18,d.x+d.width/2,d.y);
	}
	if(DEBUG){
		ctx.strokeStyle='#999';
		ctx.strokeRect(d.x-d.contentWidth/2+d.width/2,d.y,d.contentWidth,24);
	}
	if(selected==d.id){
		ctx.strokeStyle='#399';
		ctx.fillStyle='#cff';
	}
	else{
		ctx.strokeStyle='#f03';
		ctx.fillStyle='#fcc';
	}
	ctx.strokeRect(d.x,d.y,d.width,24);
	ctx.fillRect(d.x,d.y,d.width,24);
	ctx.strokeStyle='#000';
	ctx.fillStyle='#000';
	ctx.textAlign='center';
	ctx.fillText(d.title,d.x+d.width/2,d.y+20);
}

function repaint(){
	maxDepth=0;
	ctx.font="20px sans-serif";
	setChildren(data);
	canvas.width=data.contentWidth;
	canvas.height=90+maxDepth*60;
	ctx.font="20px sans-serif";
	printChildren(data);
}

/* OBJECTS */
function Tag(str,parent){
	this.id='';
	this.title=(typeof(str)=='string')?str:'';
	this.x=0;
	this.y=0;
	this.width=0;
	this.contentWidth=0;
	this.children=new Array();
	this.parent=parent;
}

/* EVENTS */
function Click(e){
	selected=findChild(e.pageX,e.pageY,data);
	repaint();
	if(selected==null){
		$('addSon').disabled=true;
		$('addSiblingL').disabled=true;
		$('addSiblingR').disabled=true;
		$('deleteChild').disabled=true;
	}
	else if(selected=='0'){
		$('addSon').disabled=false;
		$('addSiblingL').disabled=true;
		$('addSiblingR').disabled=true;
		$('deleteChild').disabled=true;
	}
	else{
		$('addSon').disabled=false;
		$('addSiblingL').disabled=false;
		$('addSiblingR').disabled=false;
		$('deleteChild').disabled=false;
	}
}

function DblClick(e){
	if(selected!=null)
		changeName();
}

function MouseDown(e){
	e.stopPropagation();
	e.preventDefault();
}
