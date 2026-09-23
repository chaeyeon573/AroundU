// 플랫폼 어댑터(AsyncStorage 캐시)를 먼저 채운 뒤 앱을 띄운다 — core의 i18n·mock DB가 import 시점에 저장소를 읽기 때문
import { hydrate } from './src/platform';

hydrate().then(() => { require('expo-router/entry'); });
