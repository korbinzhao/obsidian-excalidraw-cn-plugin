import React, { useEffect, useState, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
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
} from "./utils";
import { ResolvablePromise } from "@handraw/excalidraw/types/utils";
import { getThemeText } from "./locales/utils";

import "./App.scss";
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
  onChange: (data: ExcalidrawDataSource) => void;
  outputExcalidrawCnAppAPI: (ref: any) => void;
}


function ExcalidrawCnApp({ dataSource, onChange, outputExcalidrawCnAppAPI }: ExcalidrawAppProps) {
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
  const [files, setFiles] = useState<BinaryFiles>({});

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

  const addFilesToIndexedDB = async (files: BinaryFiles) => {
    if (!excalidrawAPI) {
      return false;
    }

    excalidrawAPI?.addFiles(Object.values(files));

    const _files = excalidrawAPI?.getFiles();

    console.log('--- addedFiles ---', _files);
  }

  useEffect(() => {

    let dataSourceObj: ExcalidrawDataSource;

    try {
      dataSourceObj = JSON.parse(dataSource);

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

  }, [dataSource]);

  const message = (message: string) => {
    excalidrawAPI?.setToast({ message, duration: 1000 })
  }

  useEffect(() => {

    if (excalidrawAPI) {
      outputExcalidrawCnAppAPI({ message });
    }

    const dataSourceObj = JSON.parse(dataSource);

    const { files } = dataSourceObj;

    if (files) {
      addFilesToIndexedDB(files);
      setFiles(files);
    }
  }, [excalidrawAPI]);


  const onLinkOpen = useCallback(
    (
      element: NonDeletedExcalidrawElement,
      event: CustomEvent<{
        nativeEvent: MouseEvent | React.PointerEvent<HTMLCanvasElement>;
      }>
    ) => {
      const link = element.link!;
      const { nativeEvent } = event.detail;
      const isNewTab = nativeEvent.ctrlKey || nativeEvent.metaKey;
      const isNewWindow = nativeEvent.shiftKey;
      const isInternalLink =
        link.startsWith("/") || link.includes(window.location.origin);
      if (isInternalLink && !isNewTab && !isNewWindow) {
        // signal that we're handling the redirect ourselves
        event.preventDefault();
        // do a custom redirect, such as passing to react-router
        // ...
      }
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

  const [pointerData, setPointerData] = useState<{
    pointer: { x: number; y: number };
    button: "down" | "up";
    pointersMap: Gesture["pointers"];
  } | null>(null);

  const onPointerDown = (
    activeTool: AppState["activeTool"],
    pointerDownState: ExcalidrawPointerDownState
  ) => {
    if (activeTool.type === "custom" && activeTool.customType === "comment") {
      const { x, y } = pointerDownState.origin;
      setComment({ x, y, value: "" });
    }
  };

  const rerenderCommentIcons = () => {
    if (!excalidrawAPI) {
      return false;
    }
    const commentIconsElements = appRef.current.querySelectorAll(
      ".comment-icon"
    ) as HTMLElement[];
    commentIconsElements.forEach((ele) => {
      const id = ele.id;
      const appstate = excalidrawAPI.getAppState();
      const { x, y } = sceneCoordsToViewportCoords(
        { sceneX: commentIcons[id].x, sceneY: commentIcons[id].y },
        appstate
      );
      ele.style.left = `${x - COMMENT_ICON_DIMENSION / 2 - appstate!.offsetLeft
        }px`;
      ele.style.top = `${y - COMMENT_ICON_DIMENSION / 2 - appstate!.offsetTop
        }px`;
    });
  };

  const switchLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLangCode(e?.target?.value);
  }

  const switchTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }

  const onPaste = async (data: ClipboardData, event: ClipboardEvent | null) => {

    console.log('--- onPaste ---', data);

    const files = data.files;

    if (files) {

      await addFilesToIndexedDB(files);

      setFiles(files);
    }

    return true;
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
  return (
    <div className={`excalidraw-cn-app theme-${theme}`} ref={appRef}>
      <Excalidraw
        ref={(api: ExcalidrawImperativeAPI) => setExcalidrawAPI(api)}
        initialData={initialStatePromiseRef.current.promise}
        onChange={(elements, appState) => {
          onChange({ elements, appState, theme, langCode, files });
        }}
        onPointerUpdate={(payload: {
          pointer: { x: number; y: number };
          button: "down" | "up";
          pointersMap: Gesture["pointers"];
        }) => setPointerData(payload)}
        viewModeEnabled={viewModeEnabled}
        zenModeEnabled={zenModeEnabled}
        gridModeEnabled={gridModeEnabled}
        theme={theme}
        langCode={langCode}
        name="Custom name of drawing"
        UIOptions={{ canvasActions: { loadScene: false } }}
        renderTopRightUI={(isMobile: boolean, appState: UIAppState) => { return null; }}
        onLinkOpen={onLinkOpen}
        onPointerDown={onPointerDown}
        onScrollChange={rerenderCommentIcons}
        onPaste={onPaste}
      >
        {renderMenu()}
      </Excalidraw>
    </div>
  );
}

export default ExcalidrawCnApp;