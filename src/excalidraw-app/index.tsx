import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  exportToCanvas,
  exportToSvg,
  exportToBlob,
  exportToClipboard,
  Excalidraw,
  useHandleLibrary,
  MIME_TYPES,
  sceneCoordsToViewportCoords,
  viewportCoordsToSceneCoords,
  restoreElements,
  LiveCollaborationTrigger,
  MainMenu,
  Footer,
  Sidebar,
  languages,
  WelcomeScreen
} from "@handraw/excalidraw";
import {
  AppState,
  UIAppState,
  BinaryFileData,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
  Gesture,
  LibraryItems,
  PointerDownState as ExcalidrawPointerDownState,
  BinaryFiles,
} from "@handraw/excalidraw/types/types";

import { NonDeletedExcalidrawElement, ExcalidrawElement } from "@handraw/excalidraw/types/element/types";
import { ClipboardData } from '@handraw/excalidraw/types/clipboard';

import { nanoid } from "nanoid";
import {
  resolvablePromise,
  withBatchedUpdates,
  withBatchedUpdatesThrottled,
  distance2d
} from "./utils/other";
import { ResolvablePromise } from "@handraw/excalidraw/types/utils";
import { getThemeText } from "./locales/utils";
import CustomWelcomeScreen from "./CustomWelcomeScreen";
import { DOUBLE_CHAIN_LINK_WITH_SQUARE_BRACKETS_REGEX, VAULT_NAME } from './utils/default';

import "./index.scss";

export interface ExcalidrawDataSource {
  elements: readonly ExcalidrawElement[];
  appState: AppState;
  theme: string;
  langCode: string;
  files: BinaryFiles;
  scrollToContent?: boolean;
  libraryItems?: LibraryItems | Promise<LibraryItems>;
}

type Comment = {
  x: number;
  y: number;
  value: string;
  id?: string;
};

type PointerDownState = {
  x: number;
  y: number;
  hitElement: Comment;
  onMove: any;
  onUp: any;
  hitElementOffsets: {
    x: number;
    y: number;
  };
};
// This is so that we use the bundled excalidraw.development.js file instead
// of the actual source code

const COMMENT_ICON_DIMENSION = 32;
const COMMENT_INPUT_HEIGHT = 50;
const COMMENT_INPUT_WIDTH = 150;

interface ExcalidrawAppProps {
  dataSource: string;
  fileName: string;
  onChange: (data: ExcalidrawDataSource) => void;
  outputExcalidrawCnAppAPI: (ref: any) => void;
  openFileInNewTab: (linkText: string) => void;
}

export interface ExcaldirawCnSetting {
  keepInSync: boolean;
}

const WAIT_TIME = 2000;

function ExcalidrawCnApp({ dataSource: dataSourceText, onChange, outputExcalidrawCnAppAPI, fileName, openFileInNewTab }: ExcalidrawAppProps) {
  const appRef = useRef<any>(null);
  const [viewModeEnabled, setViewModeEnabled] = useState(false);
  const [zenModeEnabled, setZenModeEnabled] = useState(false);
  const [gridModeEnabled, setGridModeEnabled] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [canvasUrl, setCanvasUrl] = useState<string>("");
  const [exportWithDarkMode, setExportWithDarkMode] = useState(false);
  const [exportEmbedScene, setExportEmbedScene] = useState(false);
  const [theme, setTheme] = useState("light");
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [commentIcons, setCommentIcons] = useState<{ [id: string]: Comment }>(
    {}
  );
  const [comment, setComment] = useState<Comment | null>(null);

  const [langCode, setLangCode] = useState<string>('zh-CN');

  const initialStatePromiseRef = useRef<{
    promise: ResolvablePromise<ExcalidrawInitialDataState | null>;
  }>({ promise: null! });
  if (!initialStatePromiseRef.current.promise) {
    initialStatePromiseRef.current.promise = resolvablePromise();
  }

  const [
    excalidrawAPI,
    setExcalidrawAPI
  ] = useState<ExcalidrawImperativeAPI | null>(null);

  useHandleLibrary({ excalidrawAPI });

  useEffect(() => {

    let dataSourceObj: ExcalidrawDataSource;

    try {
      dataSourceObj = JSON.parse(dataSourceText);

      const { theme, langCode } = dataSourceObj;

      if (theme) {
        setTheme(theme);
      }

      if (langCode) {
        setLangCode(langCode);
      }

      // 将 appState.collaborators 从 object 类型转为 Map 类型
      if (dataSourceObj?.appState?.collaborators) {
        dataSourceObj.appState.collaborators = new Map(Object.entries(dataSourceObj.appState.collaborators));
      }

    } catch (err) {
      console.error(err);
    }

    //@ts-ignore
    initialStatePromiseRef.current.promise.resolve(dataSourceObj);

  }, [dataSourceText]);

  const message = (message: string) => {
    excalidrawAPI?.setToast({ message, duration: 1000 })
  }

  useEffect(() => {
    if (excalidrawAPI) {
      outputExcalidrawCnAppAPI({ message });
    }
  }, [excalidrawAPI]);


  const onLinkOpen = useCallback(
    (
      element: NonDeletedExcalidrawElement,
      event: CustomEvent<{
        nativeEvent: MouseEvent | React.PointerEvent<HTMLCanvasElement>;
      }>
    ) => {
      let link = element.link!;

      const isDoubleChainLink = DOUBLE_CHAIN_LINK_WITH_SQUARE_BRACKETS_REGEX.test(link);

      if (isDoubleChainLink) {
        const fileName = link.match(DOUBLE_CHAIN_LINK_WITH_SQUARE_BRACKETS_REGEX)?.[1];
        link = `obsidian://open?vault=${VAULT_NAME}&file=${fileName}`;
      }

      const { nativeEvent } = event.detail;
      const isNewTab = nativeEvent.ctrlKey || nativeEvent.metaKey;
      const isNewWindow = nativeEvent.shiftKey;
      const isInternalLink =
        link.startsWith("/") ||
        link.includes(window.location.origin) ||
        link.startsWith("obsidian://");

      console.log('link', link, isNewTab, isNewWindow);

      if (isInternalLink && (isNewTab || isNewWindow)) {
        // signal that we're handling the redirect ourselves
        event.preventDefault();
        // do a custom redirect, such as passing to react-router

        console.log('--- open inner link ---');

        openFileInNewTab(link);

        return;
      }

      window.location.href = link;

    },
    []
  );

  const onCopy = async (type: "png" | "svg" | "json") => {
    if (!excalidrawAPI) {
      return false;
    }
    await exportToClipboard({
      elements: excalidrawAPI.getSceneElements(),
      appState: excalidrawAPI.getAppState(),
      files: excalidrawAPI.getFiles(),
      type
    });
    window.alert(`Copied to clipboard as ${type} successfully`);
  };

  // const [pointerData, setPointerData] = useState<{
  //   pointer: { x: number; y: number };
  //   button: "down" | "up";
  //   pointersMap: Gesture["pointers"];
  // } | null>(null);

  // const onPointerDown = (
  //   activeTool: AppState["activeTool"],
  //   pointerDownState: ExcalidrawPointerDownState
  // ) => {

  //   console.log('--- onPointerDown ---', activeTool, pointerDownState);

  //   // if (activeTool.type === "custom" && activeTool.customType === "comment") {
  //   //   const { x, y } = pointerDownState.origin;
  //   //   setComment({ x, y, value: "" });
  //   // }
  // };

  const switchLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLangCode(e?.target?.value);
  }

  const switchTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }

  const renderMenu = () => {
    return (
      <MainMenu>
        <MainMenu.DefaultItems.SaveAsImage />
        <MainMenu.DefaultItems.Export />
        <MainMenu.DefaultItems.Help />
        <MainMenu.DefaultItems.ClearCanvas />
        <MainMenu.Separator />
        <MainMenu.DefaultItems.Socials />
        <MainMenu.Separator />
        <MainMenu.ItemCustom>
          <button className="switch-theme" onClick={switchTheme}>{getThemeText(theme === 'light' ? 'dark' : 'light', langCode)}</button>
        </MainMenu.ItemCustom>
        <MainMenu.ItemCustom>
          <select className="language-select" name="language" id="language" defaultValue={'zh-CN'} onChange={switchLanguage} >
            {languages.filter(language => !language.code.startsWith('__')).map(language => {
              return <option key={language.code} value={language.code}>{language.label}</option>
            })}
          </select>
        </MainMenu.ItemCustom>
        <MainMenu.DefaultItems.ChangeCanvasBackground />
      </MainMenu>
    );
  };

  // const onExcalidrawChange = useCallback((elements: ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
    
  //   console.log('--- onExcalidrawChange ---', timerRef.current);
    
  //   if (timerRef.current) {
  //     return;
  //   }

  //   const timeout = setTimeout(() => {
  //     clearTimeout(timeout);
  //     timerRef.current = undefined;
  //     onChange({ elements, appState, theme, langCode, files });
  //   }, WAIT_TIME);

  //   timerRef.current = timeout;
  // }, [timerRef.current])

  console.log('---- render excalidraw-app ---');

  return (
    <div className={`excalidraw-cn-app theme-${theme}`} ref={appRef}>
      <Excalidraw
        ref={(api: ExcalidrawImperativeAPI) => setExcalidrawAPI(api)}
        initialData={initialStatePromiseRef.current.promise}
        onChange={(elements: ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
          onChange({ elements, appState, theme, langCode, files });
        }}
        // onPointerUpdate={(payload: {
        //   pointer: { x: number; y: number };
        //   button: "down" | "up";
        //   pointersMap: Gesture["pointers"];
        // }) => {
        //   console.log('--- onPointerUpdate ---', payload);
        //   setPointerData(payload);
        // }}
        viewModeEnabled={viewModeEnabled}
        zenModeEnabled={zenModeEnabled}
        gridModeEnabled={gridModeEnabled}
        theme={theme}
        langCode={langCode}
        name={fileName}
        // UIOptions={{ canvasActions: { loadScene: false } }}
        // renderTopRightUI={(isMobile: boolean, appState: UIAppState) => { return null; }}
        onLinkOpen={onLinkOpen}
      // onPointerDown={onPointerDown}
      // onScrollChange={rerenderCommentIcons}
      // onPaste={async (data: ClipboardData, event: ClipboardEvent | null) => {
      //   console.log('--- onPaste ---', data, event);
      //   return true;
      // }}
      >
        {renderMenu()}
        <CustomWelcomeScreen langCode={langCode} />
      </Excalidraw>
    </div>
  );
}

export default ExcalidrawCnApp;