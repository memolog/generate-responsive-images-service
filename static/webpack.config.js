const webpack = require('webpack');
const path = require('path');

module.exports = {
	context: path.resolve(__dirname, 'src'),
	entry: path.resolve(__dirname, 'src/app.tsx'),

	output: {
		path: path.resolve(__dirname, 'public/js'),
		publicPath: '/',
		filename: 'bundle.js'
	},

	resolve: {
		extensions: ['.jsx', '.js', '.ts', '.tsx', '.scss'],
		modules: [
			path.resolve(__dirname, 'node_modules'),
		],
		alias: {
			'react': 'preact-compat',
			'react-dom': 'preact-compat'
		}
	},

	module: {
		rules: [
			{
				test: /\.jsx?$/,
				exclude: /node_modules/,
				use: 'babel-loader'
			}, {
				test: /\.tsx?$/,
				exclude: /node_modules/,
				use: 'ts-loader'
			}, {
				test: /\.scss$/,
				exclude: /node_modules/,
				use: [{
					loader: 'style-loader'
				},{
					loader: 'css-loader'
				}, {
					loader: 'postcss-loader'
				}, {
					loader: 'sass-loader'
				}]
			}
		]
	}
};