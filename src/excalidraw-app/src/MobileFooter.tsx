import { useDevice, Footer } from "@handraw/excalidraw";
import { ExcalidrawImperativeAPI } from "@handraw/excalidraw/types/types";
import CustomFooter from "./CustomFooter";

const MobileFooter = ({
  excalidrawAPI
}: {
  excalidrawAPI: ExcalidrawImperativeAPI;
}) => {
  const device = useDevice();
  if (device.isMobile) {
    return (
      <Footer>
        <CustomFooter excalidrawAPI={excalidrawAPI} />
      </Footer>
    );
  }
  return null;
};
export default MobileFooter;
