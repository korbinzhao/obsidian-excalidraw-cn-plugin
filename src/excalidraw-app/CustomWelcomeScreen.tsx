import React, { useEffect } from "react";
import { WelcomeScreen, useI18n } from "@handraw/excalidraw";
import { GithubIcon, TwitterIcon, shareWindows } from './icons/icons'
import { setLanguage, getLanguageText } from './locales';

interface Props {
  langCode: string;
}

export default function CustomWelcomeScreen({ langCode}: Props) {

  const { t } = useI18n();

  useEffect(() => {
    setLanguage(langCode);
  }, [langCode]);

  return <WelcomeScreen>
    <WelcomeScreen.Hints.MenuHint>
      {t("welcomeScreen.app.menuHint")}
    </WelcomeScreen.Hints.MenuHint>
    <WelcomeScreen.Hints.ToolbarHint />
    <WelcomeScreen.Hints.HelpHint />
    <WelcomeScreen.Center>
      <WelcomeScreen.Center.Logo>Excalidraw CN - handraw.top</WelcomeScreen.Center.Logo>
      <WelcomeScreen.Center.Heading>
        {t("welcomeScreen.app.center_heading")}
      </WelcomeScreen.Center.Heading>
      <WelcomeScreen.Center.Menu>
        <WelcomeScreen.Center.MenuItemLoadScene />
        <WelcomeScreen.Center.MenuItemHelp />
        <WelcomeScreen.Center.MenuItemLink
          icon={GithubIcon}
          aria-label="GitHub"
          href="https://github.com/korbinzhao/excalidraw-cn">
          {getLanguageText('welcome.github')}
        </WelcomeScreen.Center.MenuItemLink>
        <WelcomeScreen.Center.MenuItemLink
          icon={TwitterIcon}
          href="https://twitter.com/korbinzhao"
          aria-label="Twitter">
           {getLanguageText('welcome.twitter')}
        </WelcomeScreen.Center.MenuItemLink>
        <WelcomeScreen.Center.MenuItemLink
          icon={shareWindows}
          href="https://handraw.top"
          aria-label="handraw.top">
           {getLanguageText('welcome.homepage')}
        </WelcomeScreen.Center.MenuItemLink>
      </WelcomeScreen.Center.Menu>
    </WelcomeScreen.Center>
  </WelcomeScreen>
}