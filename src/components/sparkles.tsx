import { useEffect, useRef, useState } from "react";


export function Sparkles(props: {width: number, height: number, count: number, scale?: number}) {
    const ref = useRef<HTMLDivElement>(null);

    return (
        <div 
            ref={ref} 
            className='relative w-full h-full origin-top-left' 
            style={{ width: `${props.width}px`, height: `${props.height}px`}}>
            {new Array(props.count).fill(0).map(_ => <Dot height={props.height} width={props.width} />)}
        </div>
    )
}

function Dot(props: { width?: number, height?: number }) {

    const [scale, setScale] = useState<number>();
    const [x, setX] = useState<number>();
    const [y, setY] = useState<number>();

    useEffect(() => {
        setX(Math.random() * ((props.width || 24) - 24));
        setY(Math.random() * ((props.height || 24) - 24));
        setScale(0);
        setTimeout(() => grow(), Math.random() * 1000);
    }, [props.height, props.width])

    function grow() {
        setScale(Math.random() * .5 + .5);
        setTimeout(() => shrink(), 1000)
    }

    function shrink() {
        setScale(0);
        setTimeout(() => {
            setX(Math.random() * ((props.width || 24) - 24));
            setY(Math.random() * ((props.height || 24) - 24));
            grow();
        }, 1000)
    }

    return (
        <div
            className="absolute w-6 h-6 rounded-full bg-blue-500 transform transition-transform duration-1000"
            style={{ transform: `scale(${scale})`, left: x, top: y }}
        ></div>
    )
}