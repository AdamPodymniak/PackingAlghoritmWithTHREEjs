var scene;
var camera;
var renderer;
var controls;
var viewModel;
var itemMaterial;

async function PackContainers() {
	return $.ajax({
		url: '/api/containerpacking',
		type: 'POST',
		contentType: 'application/json; charset=utf-8'
	});
};

function InitializeDrawing() {
	var container = $('#drawing-container');

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 50, window.innerWidth/window.innerHeight, 0.1, 1000 );
	camera.lookAt(scene.position);
	var light = new THREE.PointLight(0xffffff);
	light.position.set(0,150,100);
	scene.add(light);

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setClearColor( 0xf0f0f0 );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth / 1.3, window.innerHeight / 1.3);
	container.append( renderer.domElement );

	controls = new THREE.OrbitControls( camera, renderer.domElement );
	window.addEventListener( 'resize', onWindowResize, false );
	animate();
};

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth / 1.3, window.innerHeight / 1.3 );
}
//
function animate() {
	requestAnimationFrame( animate );
	controls.update();
	render();
}
function render() {
	renderer.render( scene, camera );
}

var ViewModel = function () {
	var self = this;

	self.ItemCounter = 0;
	self.ContainerCounter = 0;

	self.ItemsToRender = [];
	self.LastItemRenderedIndex = -1;

	self.ContainerOriginOffset = {
		x: 0,
		y: 0,
		z: 0
	};
	PackContainers()
		.then(response => {
			self.algorithmPackingResults = response.AlgorithmPackingResults[0];
			console.log(response);
		}).then(() => {
			var selectedObject = scene.getObjectByName('container');
			scene.remove(selectedObject);

			for (var i = 0; i < 1000; i++) {
				var selectedObject = scene.getObjectByName('cube' + i);
				var selectedEdge = scene.getObjectByName('line' + i);
				scene.remove(selectedObject);
				scene.remove(selectedEdge);
			}

			camera.position.set(10, 10, 10);

			self.algorithmPackingResults.PackedItems.forEach(item => {
				self.ItemsToRender.push(item);
            })
			self.LastItemRenderedIndex = -1;

			self.ContainerOriginOffset.x = -1 * 5;
			self.ContainerOriginOffset.y = -1 * 5;
			self.ContainerOriginOffset.z = -1 * 5;

			var geometry = new THREE.BoxGeometry(10, 10, 10);
			var geo = new THREE.EdgesGeometry(geometry);
			var mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
			var wireframe = new THREE.LineSegments(geo, mat);
			wireframe.position.set(0, 0, 0);
			wireframe.name = 'container';
			scene.add(wireframe);

			var e = 0;
			self.ItemsToRender.forEach(() => e++);
			for (var i = 0; i < e; i++) {
				self.PackItemInRender();
			}
        });

	self.StringToColour = function(str, dataType) {
		var hash = 0;
		for (var i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		var colour = dataType;
		for (var i = 0; i < 3; i++) {
			var value = (hash >> (i * 8)) & 0xFF;
			colour += ('00' + value.toString(16)).substr(-2);
		}
		return colour;
	}

	self.CreateTexture = function (tag, itemIndex) {
		var textCanvas = document.createElement("canvas");
		textCanvas.width = self.ItemsToRender[itemIndex].PackDimX * 60;
		textCanvas.height = self.ItemsToRender[itemIndex].PackDimY * 60;
		var ctx = textCanvas.getContext("2d");
		ctx.fillStyle = self.StringToColour(tag, '#');
		ctx.fillRect(0, 0, textCanvas.width, textCanvas.height);
		var textSize = self.ItemsToRender[itemIndex].PackDimX * self.ItemsToRender[itemIndex].PackDimY;
		if (textSize >= 30) { textSize /= 3 };
		if (textSize <= 10) { textSize *= 1.3 };
		if (textSize <= 5) { textSize *= 2 };
		ctx.font = `bold ${textSize*2}px Arial`;
		ctx.fillStyle = "black";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(tag.toUpperCase(), textCanvas.width / 2, textCanvas.height / 2);
		const newTexture = new THREE.CanvasTexture(textCanvas);
		return newTexture;
    }

	self.PackItemInRender = function () {

		var itemIndex = self.LastItemRenderedIndex + 1;

		var itemOriginOffset = {
			x: self.ItemsToRender[itemIndex].PackDimX / 2,
			y: self.ItemsToRender[itemIndex].PackDimY / 2,
			z: self.ItemsToRender[itemIndex].PackDimZ / 2
		};

		itemMaterial = new THREE.MeshBasicMaterial({ map: self.CreateTexture(self.ItemsToRender[itemIndex].Tag, itemIndex) });

		var itemGeometry = new THREE.BoxGeometry(self.ItemsToRender[itemIndex].PackDimX, self.ItemsToRender[itemIndex].PackDimY, self.ItemsToRender[itemIndex].PackDimZ);
		var cube = new THREE.Mesh(itemGeometry, itemMaterial);
		cube.position.set(self.ContainerOriginOffset.x + itemOriginOffset.x + self.ItemsToRender[itemIndex].CoordX, self.ContainerOriginOffset.y + itemOriginOffset.y + self.ItemsToRender[itemIndex].CoordY, self.ContainerOriginOffset.z + itemOriginOffset.z + self.ItemsToRender[itemIndex].CoordZ);
		cube.name = 'cube' + itemIndex;
		scene.add(cube);

		var edges = new THREE.EdgesGeometry(cube.geometry);
		var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }));
		line.position.set(self.ContainerOriginOffset.x + itemOriginOffset.x + self.ItemsToRender[itemIndex].CoordX, self.ContainerOriginOffset.y + itemOriginOffset.y + self.ItemsToRender[itemIndex].CoordY, self.ContainerOriginOffset.z + itemOriginOffset.z + self.ItemsToRender[itemIndex].CoordZ);
		line.renderOrder = 1;
		line.name = 'line' + itemIndex;
		scene.add(line)

		self.LastItemRenderedIndex = itemIndex;
	};
};

$(document).ready(() => {
	$('[data-toggle="tooltip"]').tooltip(); 
	InitializeDrawing();

	viewModel = new ViewModel();
});