import { Button_1$48 } from "../components/Button_1$48";
import React, { FC, CSSProperties } from "react";
export const CarouselContent2_2$127: FC<{
  style: CSSProperties,
}> = (props) => {
  return (
    <div
      data-fid="2:127"
      style={{
        ...{
          position: "absolute",
          boxSizing: "border-box",
          backgroundColor: "rgba(0, 0, 0, 0)",
          backgroundImage:
            "url(../images/6e40f86b35e43b1121d9c766114cb456.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: "6.75px 6.75px 6.75px 6.75px",
        },
        ...props.style,
      }}
      data-fname="carousel content 2"
    >
      <div
        data-fid="2:102"
        style={{
          zIndex: 0,
          position: "absolute",
          boxSizing: "border-box",
          top: "44%",
          transform: " translateY(-50%)",
          height: 42,
          left: 34,
          width: 122,
          color: "#ffffff",
          fontSize: 36,
          fontWeight: 700,
          fontFamily: '"Roboto"',
          fontStyle: "normal",
          lineHeight: "125%",
          letterSpacing: "0px",
          textAlign: "left",
        }}
        data-fname="Sample"
      >
        <span style={{}} key="end">
          Sample
        </span>
      </div>
      <div className="maxer">
        <div
          data-fid="2:116"
          style={{
            zIndex: 1,
            display: "flex",
            flexDirection: "row",
            gap: 20,
            justifyContent: "center",
            alignItems: "flex-end",
            position: "absolute",
            boxSizing: "border-box",
            bottom: 32,
            height: 34,
            left: "51%",
            transform: " translateX(-50%)",
            width: 233,
            backgroundColor: "rgba(0, 0, 0, 0)",
          }}
          data-fname="Frame 15"
        >
          <div
            data-fid="2:109"
            style={{
              zIndex: 0,
              position: "relative",
              boxSizing: "border-box",
              flexGrow: 0,
              alignSelf: "inherit",
              width: 104,
              height: 34,
              color: "#ffffff",
              fontSize: 14.399999618530273,
              fontWeight: 400,
              fontFamily: '"Roboto"',
              fontStyle: "normal",
              lineHeight: "125%",
              letterSpacing: "0px",
              textAlign: "left",
            }}
            data-fname="asdfasdf asd fasd fasdf"
          >
            <span style={{}} key="end">
              asdfasdf asd fasd fasdf
            </span>
          </div>
          <Button_1$48
            data-fid="2:111"
            style={{
              zIndex: 1,
              display: "flex",
              flexDirection: "row",
              paddingTop: 8,
              paddingRight: 24,
              paddingBottom: 8,
              paddingLeft: 24,
              alignItems: "center",
              position: "relative",
              boxSizing: "border-box",
              flexGrow: 0,
              alignSelf: "inherit",
              width: 109,
              height: 33,
              backgroundColor: "rgba(0, 0, 0, 0)",
              border: "4px solid #ffffff",
              borderRadius: "68px 68px 68px 68px",
            }}
            data-fname="Button"
          ></Button_1$48>
        </div>
      </div>
    </div>
  );
};