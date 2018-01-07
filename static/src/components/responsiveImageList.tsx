import { h, Component } from 'preact';

export function RespnsiveImageList(props) {
  const images = props.images || [];
  if (!images.length) { return null; }
  const blockStyle = {
    maxWidth: 400,
    margin: '1em auto',
    padding: '15px',
    borderRadius: '4px',
    border: '1px solid #bababa'
  };
  const listStyle = {
    listStyleType: 'none',
    margin: '0',
    padding: '0'
  };
  const itemStyle = {
    margin: '.5em 0'
  };
  const imageStyle = {
    maxHeight: 34,
    marginRight: '5px',
    float: 'left'
  };
  const linkStyle = {
    textOverflow: 'ellipsis',
    display: 'block',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    lineHeight: '34px'
  };
  const imageElements = images.map( (image) => {
    const imageLinkLabel = (image.split(/\//) || []).pop() || 'image';
    return (
      <li style={itemStyle}>
        <img src={image} style={imageStyle} /><a href={image} onClick={props.clickHandler} style={linkStyle}>{imageLinkLabel}</a>
      </li>
    )
  });
  return (
    <div style={blockStyle}>
      <ul style={listStyle}>
        {imageElements}
      </ul>
    </div>
  )
}