import { h, render, Component } from 'preact';

class App extends Component {
  constructor(props) {
		super(props);
		this.submitHandler = this.submitHandler.bind(this);
	}
	submitHandler(event){
		event.preventDefault();
		event.stopPropagation();
    
    const uploadFile = document.getElementById('upload-image').files[0];
    const formData = new FormData();
    formData.append('image', uploadFile);

    fetch('http://localhost:3000/convert', {
      method: 'POST',
      body: formData
    })
    .then((resp)=>{
      console.log('success');
      console.log(resp);
    })
    .catch(err => console.log(err));
  }
	render() {
		return (
			<div>
				<form>
					<input type="file" accept="images/jpeg" id="upload-image" />
					<button onClick={this.submitHandler}>upload</button>
				</form>
			</div>
		);
	}
}

export default App