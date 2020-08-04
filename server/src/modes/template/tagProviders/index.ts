import { IHTMLTagProvider } from './common';
import { getHTML5TagProvider } from './htmlTags';
import { getVueTagProvider } from './vueTags';
import { getRouterTagProvider } from './routerTags';
import { getWXMLTagProvider } from './wxTags';
import {
  elementTagProvider,
  onsenTagProvider,
  bootstrapTagProvider,
  gridsomeTagProvider,
  getDependencyTagProvider,
  getWorkspaceTagProvider
} from './externalTagProviders';
export { getComponentInfoTagProvider as getComponentTags } from './componentInfoTagProvider';
export { IHTMLTagProvider } from './common';

import * as ts from 'typescript';
import * as fs from 'fs';
import { join } from 'path';
import { getNuxtTagProvider } from './nuxtTags';

export let allTagProviders: IHTMLTagProvider[] = [
  getHTML5TagProvider(),
  getVueTagProvider(),
  getRouterTagProvider(),
  getWXMLTagProvider(),
  elementTagProvider,
  onsenTagProvider,
  bootstrapTagProvider,
  gridsomeTagProvider
];

export interface CompletionConfiguration {
  [provider: string]: boolean;
}

export function getTagProviderSettings(workspacePath: string | null | undefined) {
  const settings: CompletionConfiguration = {
    html5: false,
    vue: false,
    router: false,
    element: false,
    onsen: false,
    bootstrap: false,
    buefy: false,
    vuetify: false,
    quasar: false, // Quasar v1+
    'quasar-framework': false, // Quasar pre v1
    nuxt: false,
    gridsome: false,
    wxml: true
  };
  if (!workspacePath) {
    return settings;
  }
  try {
    const packagePath = ts.findConfigFile(workspacePath, ts.sys.fileExists, 'package.json');
    if (!packagePath) {
      return settings;
    }

    const rootPkgJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    const dependencies = rootPkgJson.dependencies || {};
    const devDependencies = rootPkgJson.devDependencies || {};

    if (dependencies['vue-router']) {
      settings['router'] = true;
    }
    if (dependencies['element-ui']) {
      settings['element'] = true;
    }
    if (dependencies['vue-onsenui']) {
      settings['onsen'] = true;
    }
    if (dependencies['bootstrap-vue']) {
      settings['bootstrap'] = true;
    }
    if (dependencies['buefy'] || devDependencies['buefy']) {
      settings['buefy'] = true;
    }
    if (dependencies['nuxt-buefy'] || devDependencies['nuxt-buefy']) {
      dependencies['buefy'] = true;
    }
    if (dependencies['vuetify'] || devDependencies['vuetify']) {
      settings['vuetify'] = true;
    }
    if (dependencies['@nuxtjs/vuetify'] || devDependencies['@nuxtjs/vuetify']) {
      dependencies['vuetify'] = true;
    }
    // Quasar v1+:
    if (dependencies['quasar'] || devDependencies['quasar']) {
      settings['quasar'] = true;
    }
    // Quasar pre v1 on non quasar-cli:
    if (dependencies['quasar-framework']) {
      settings['quasar-framework'] = true;
    }
    // Quasar pre v1 on quasar-cli:
    if (devDependencies['quasar-cli']) {
      // pushing dependency so we can check it
      // and enable Quasar later below in the for()
      dependencies['quasar-framework'] = '^0.0.17';
    }
    if (dependencies['nuxt'] || dependencies['nuxt-edge'] || devDependencies['nuxt'] || devDependencies['nuxt-edge']) {
      const nuxtTagProvider = getNuxtTagProvider(workspacePath);
      if (nuxtTagProvider) {
        settings['nuxt'] = true;
        allTagProviders.push(nuxtTagProvider);
      }
    }
    if (dependencies['gridsome']) {
      settings['gridsome'] = true;
    }

    const workspaceTagProvider = getWorkspaceTagProvider(workspacePath, rootPkgJson);
    if (workspaceTagProvider) {
      allTagProviders.push(workspaceTagProvider);
    }

    for (const dep in dependencies) {
      const runtimePkgJsonPath = ts.findConfigFile(
        workspacePath,
        ts.sys.fileExists,
        join('node_modules', dep, 'package.json')
      );

      if (!runtimePkgJsonPath) {
        continue;
      }

      const runtimePkgJson = JSON.parse(fs.readFileSync(runtimePkgJsonPath, 'utf-8'));
      if (!runtimePkgJson) {
        continue;
      }

      const depTagProvider = getDependencyTagProvider(workspacePath, runtimePkgJson);
      if (!depTagProvider) {
        continue;
      }

      allTagProviders.push(depTagProvider);
      settings[dep] = true;
    }
  } catch (e) {}
  return settings;
}

export function getEnabledTagProviders(tagProviderSetting: CompletionConfiguration) {
  return allTagProviders.filter(p => tagProviderSetting[p.getId()] !== false);
}
