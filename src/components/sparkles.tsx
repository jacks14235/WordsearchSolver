import { useEffect, useRef, useState } from "react";


export function Sparkles(props: {width: number, height: number, count: number}) {
    const ref = useRef<HTMLDivElement>(null);

    return (
        <div ref={ref} className='relative w-full h-full' style={{ width: `${props.width}px`, height: `${props.height}px`}}>
            {new Array(props.count).fill(0).map(_ => <Dot parentHeight={props.height} parentWidth={props.width} />)}
        </div>
    )
}

function Dot(props: { parentWidth?: number, parentHeight?: number }) {

    const [scale, setScale] = useState<number>();
    const [x, setX] = useState<number>();
    const [y, setY] = useState<number>();

    useEffect(() => {
        setX(Math.random() * (props.parentWidth || 0));
        setY(Math.random() * (props.parentWidth || 0));
        setTimeout(() => grow(), Math.random() * 500);
    }, [props.parentHeight, props.parentWidth])

    function grow() {
        setScale(Math.random() * .5 + .5);
        setTimeout(() => shrink(), 500)
    }

    function shrink() {
        setScale(0);
        setTimeout(() => {
            setX(Math.random() * (props.parentWidth || 0));
            setY(Math.random() * (props.parentWidth || 0));
            grow();
        }, 500)
    }

    return (
        <div
            className="absolute w-4 h-4 rounded-full bg-blue-500 transform transition-transform duration-500"
            style={{ transform: `scale(${scale})`, left: x, top: y }}
        ></div>
    )
}