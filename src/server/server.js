import fs from 'fs';

//react
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import MetaTagsServer from 'react-meta-tags/server';
import { MetaTagsContext } from 'react-meta-tags';
import { StaticRouter as Router, matchPath } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import routers from '@routers';
import createStore from '@redux';

//components
import Layout from '@app/layout';

// 读取模板页面
const htmlTemplate = fs.readFileSync('./dist/assets/app.html', 'utf-8');

import { fetchUserData } from '@redux/actions/userInfo';

export const getRenderPage = async (req, res) => {
	let access_token = req.cookies['access_token'] || '';
	// console.log(`access_token:${access_token}`);
	const store = createStore({});
	const dispatch = store.dispatch;
	if (access_token) {
		//获取用户信息存入store
		await fetchUserData(access_token)(dispatch).catch(err => console.log(err));
		return res.send(renderReplace({ store }));
	}
	let currentRoute = null,
		match = null;
	routers.some(route => {
		let _match = matchPath(req.path, route);
		if (_match) {
			currentRoute = route;
			match = _match;
		}
		return _match;
	});

	//加载redux数据的方法
	if (currentRoute.loadData) {
		await currentRoute.loadData()(dispatch, match);
		//组件预加载
		await currentRoute.component.preload();
	} else {
		currentRoute.component = () => <div />;
	}

	const metaTagsInstance = MetaTagsServer();

	// const context = {};
	const AppComponent = ReactDOMServer.renderToString(
		<ReduxProvider store={store}>
			<MetaTagsContext extract={metaTagsInstance.extract}>
				<Router location={req.url}>
					<Layout />
				</Router>
			</MetaTagsContext>
		</ReduxProvider>
	);

	const meta = metaTagsInstance.renderToString();
	res.send(renderReplace({ store, meta, AppComponent }));
}

//模板字段替换
const renderReplace = ({ store, meta = '', AppComponent = '' }) => {
	const reduxState = JSON.stringify(store.getState()).replace(/</g, '\\x3c');
	let reactDom = htmlTemplate.replace('<!--app-->', AppComponent);
	reactDom = reactDom.replace('<!--initState-->', reduxState);
	reactDom = reactDom.replace('<!--meta-->', meta);
	return reactDom;
};