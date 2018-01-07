import { h, render, Component } from 'preact';
import './style/app.scss';

interface AppProps {}

interface AppState {
  imagePreviewSrc?: string
}

function ImagePreview(props) {
  const src = props && props.src;
  if (!src) { return null; }
  return <img src={src} className="image-preview" />
}

class App extends Component<AppProps, AppState> {
  constructor(props) {
    super(props);
    this.state = {
      imagePreviewSrc: null
    }
    this.submitHandler = this.submitHandler.bind(this);
    this.onChangeHandler = this.onChangeHandler.bind(this);
	}
	submitHandler(event){
		event.preventDefault();
		event.stopPropagation();
    
    const fileElement = document.getElementById('upload-image');
    if (!(fileElement instanceof HTMLFormElement)) {
      return;
    }
    
    const uploadFile = fileElement.files[0];
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
  onChangeHandler(event) {
    const files = event.target.files
    const file = files && files.length && files[0];
    if (!file) { 
      this.setState({
        imagePreviewSrc: null
      });
    }
    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      this.setState({
        imagePreviewSrc: fileReader.result
      });
    }
    fileReader.readAsDataURL(file);
  }
	render() {
		return (
			<div>
				<form>
					<input type="file" accept="images/jpeg" id="upload-image" onChange={this.onChangeHandler} />
          <ImagePreview src={this.state.imagePreviewSrc} />
					<button onClick={this.submitHandler}>upload</button>
				</form>
			</div>
		);
	}
}

render(
  <App />,
  document.body
)