import React, { useState, useEffect } from "react";
import {
    Transition,
    Dimmer,
    Loader,
    Grid,
    Input,
    Modal,
    // Header,
    // Button 
} from "semantic-ui-react";
import Cookies from "universal-cookie";
import { withApiSso } from "./apis/api";
import "../css/login.scss";
import swal from "sweetalert2";
import ButtonControl from "./components/controls/v3/button-control";
import TitleControl from "./components/controls/v2/title-control";
import axios from 'axios';
import Cookie from "universal-cookie";

const cookies = new Cookies();

const Authentication = ({idle , api, location}) => {

    const transformURL = (module) => {
        const urls = window.Gon.assets().urls
        const domain = module.concat("_url")
        return urls[domain]
    };
    
    const handleLogout = async () => {
        axios.get(transformURL("oauth_identity_sever"), {params: {
            id_token_hint: window.localStorage.getItem('id_token'),
            post_logout_redirect_uri: transformURL("oauth_logout")
        }}).then(({ request }) => {
            deleteCookie();
            window.localStorage.clear();
            window.location.href = request?.responseURL;
        });
    };   

    const deleteCookie = () => {
        const cookies = new Cookie();
        _.map(cookies.getAll(), function (_val, key) {
            switch (key) {
                case "access_token":
                    cookies.remove("access_token");
                    break;
                case "guardian_token":
                    cookies.remove("guardian_token");
                    break;
            }
        });
    }; 

    const [state, setState] = useState({
        payroll: "",
        captcha: ""
    });

    const [error, setError] = useState({
        payroll: false,
        payrollText: "",
        captchaText: "",
        captcha: false
    });
    
    const [openRoles, setOpenRoles] = useState(false);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState("");
    // const [token, setToken] = useState("");
    const [capsLock, setCapsLock] = useState(false);
    const [roles, setRoles] = useState([]);
    // const [openTerms, setOpenTerms] = useState(false);

    function handleChange(evt) {
        const value = evt.target !== undefined ? evt.target.value : evt;
        const name = evt.target !== undefined ? evt.target.name : "captcha";
        setState({
            ...state,
            [name]: value,
            ["captcha"]: name === "captcha" ? value : ""
        });
    }

    function handleKeyDown(evt) {
        const name = evt.target !== undefined ? evt.target.name : "captcha";
        const text = name + "Text";
        const isCapsLock = evt.getModifierState("CapsLock");

        if (name === "payroll") {
            if (name === "password") {
                setCapsLock(isCapsLock);
                setError({
                    ...error,
                    ["errorText"]: ""
                });
            } else {
                setCapsLock(false);
            }
        }

        setError({
            ...error,
            [name]: false,
            [text]: ""
        });
    }

    async function handleSubmit() {
        setCapsLock(false);
        const data = JSON.parse(localStorage.getItem("current_user"));
        setError({
            ...error,
            ["payroll"]: state.payroll === "",
            ["payrollText"]: state.payroll === "" ? "Enter payroll code" : ""
        });

        if (
            state.payroll !== ""
        ) {
            setLoading(true);

            let bodyParameters = {
                username: data.data.preferred_username,
                email: data.data.email,
                payroll_code: state.payroll,
                application: "PL"
            };

            setError({
                ...error,
                ["payroll"]: false
            });

            setState({
                ...state,
                ["captcha"]: ""
            });
           
            const res = await api.sso.PostMethod("users/identity-server/login", bodyParameters);

            if (res.data.errors) {
                let payroll = res.data.errors.payroll_code
                let message = res.data.errors.message
                const payroll_code = payroll !== undefined ? payroll : ""
                const messages = message !== undefined ? message : ""
               
                if (payroll_code) {
                    setError({
                        ...error,
                        ["payroll"]: payroll !== "",
                        ["payrollText"]: payroll
                    });
                }

                if (messages) {
                    swal.fire({
                        title: "Something went wrong. Please try again later",
                        icon: "error",
                        allowOutsideClick: false,
                        confirmButtonText: 'OK',
                        confirmButtonClass: 'ui small positive floated button',
                        buttonsStyling: false,
                    })
                    handleLogout()
                }
            } else {
                setError({
                    ...error,
                    ["payroll"]: false,
                    ["payrollText"]: ""
                });

                setUser(res.data.user_id);
                if (res.data.roles !== undefined) {
                    setRoles(res.data.roles);
                }
                // if (res.data.token !== undefined) {
                //     setToken(res.data.token);
                // }
                    if (res.data.token !== undefined) {
                        let access_token = res.data.token;
                        access_token = access_token.split("Bearer ");
                        access_token = access_token[1];
                        cookies.set("access_token", access_token, { path: "/" });
                        window.location.href = "/dashboard";
                    } else {
                        setOpenRoles(true);
                }
            }
            setLoading(false);
        }
    }

    function handleLogin(evt) {
        if (evt.keyCode === 13) {
            handleSubmit();
        }
    }

    async function handleSelectRole(evt) {
        const role = evt.target.name;

        let bodyParameters = {
            user_id: user,
            role_id: role
        };

        setOpenRoles(false);
        setLoading(true);

        const response = await api.sso.PostMethod("/users/select-role", bodyParameters);

        if (response.data.hasOwnProperty("token")) {
            let access_token = response.data.token;
            access_token = access_token.split("Bearer ");
            access_token = access_token[1];
            cookies.set("access_token", access_token, { path: "/" });
            window.location.href = "/dashboard";
        }
    }
    
    
    useEffect(() => {
        const token = cookies.get("access_token")
        const hint  = localStorage.getItem("id_token");

        if (token && hint ) {
            setLoading(true);
            window.location.href = '/dashboard'
         } else if (!hint) {
            setLoading(true);
            window.location.href = '/'
         } else {
            setLoading(false);
         }

    }, [location]);

    // async function handleTerms(evt) {
        // let bodyParameters = {
        //     user_id: user,
        //     terms_n_condition_id: terms
        // };

        // const res = await api.sso.PostMethod("/users/update-terms-and-condition", bodyParameters);

        // if (res.data.errors === undefined) {
        //     setOpenTerms(false);
        //     if (roles.length !== 0) {
        //         setOpenRoles(true);
        //     } else {
        //         setLoading(true);
        //         let access_token = token.split("Bearer ");
        //         access_token = access_token[1];
        //         cookies.set("access_token", access_token, { path: "/" });
        //         window.location.href = "/dashboard";
        //     }
        // }
    // }


    return (
        <Grid id="login-container" onKeyDown={handleLogin}>
        {loading ? (
            <Dimmer active inverted>
                <Loader active />
            </Dimmer>
        ) : (
            ""
        )}
        <Grid.Column width={9}>
            <Grid className="wrapper">
             <TitleControl as="h1" size="huge" title={`Login to PayorLink`} />
                
                <Grid.Row></Grid.Row><Grid.Row></Grid.Row>

                <Grid.Row style={{ marginTop: "-70px" }}>PAYROLL CODE</Grid.Row>

                <Grid.Row style={{ marginTop: "-30px" }}>
                    <Input
                        name="payroll"
                        placeholder="Enter payroll code"
                        className="input"
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        value={state.payroll}
                        error={error.payroll}
                        tabIndex="3"
                    />
                </Grid.Row>

                {error.payroll ? (
                    <Grid.Row style={{ margin: "-28px 5px -16px 0px" }}>
                        <p style={{ fontStyle: "italic", color: "red" }}>{error.payrollText}</p>
                    </Grid.Row>
                ) : (
                    <Grid.Row style={{ marginTop: "-25px" }}></Grid.Row>
                )}

                   {capsLock ? (
                        <Grid.Row style={{marginBottom: "-50px" }}>
                            <p style={{ fontStyle: "italic", color: "red" }}>Caps Lock is On</p>
                        </Grid.Row>
                    ) : "" }


                <Grid.Row>
                    <ButtonControl
                         style={{
                            backgroundColor: "rgb(0, 128, 43)",
                            width: "40%",
                            marginTop: "3%"
                          }}
                         onClick={handleSubmit}
                         fluid
                         padded
                        //  loading={loading}
                         size="huge"
                         name="login"
                         text='Log in'
                        />
                </Grid.Row>
            </Grid>
        </Grid.Column>

        <Grid.Column>
            <img className="banner" src="../../images/payorlink_banner.jpg" />
        </Grid.Column>

        {idle ? (
            <div className="ui mini modal" id="idle_modal">
                <div className="content">
                    <div className="ui form" id="enter_member_detail_form">
                        <div className="ui grid">
                            <div className="ui container idle_modal_container">
                                <div className="field">
                                    <img src="../../images/idle-sheep2.png" />
                                </div>

                                <div className="field">
                                    <h4 className="">Seems like your session timed out.</h4>
                                </div>

                                <div className="field">
                                    <span className="member_details_text">
                                        Log back in to continue.
                                    </span>
                                </div>

                                <button
                                    className="modal-open-main ui button"
                                    style={{
                                        backgroundColor: "rgb(0, 128, 43)",
                                        color: "white"
                                    }}
                                    id="idle_ok"
                                >
                                    Login
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            ""
        )}

{/* <Transition animation="scale" duration={400} unmountOnHide={true} visible={openTerms}> */}
                {/* <Modal
                    dimmer="inverted"
                    size={"small"}
                    open={true}
                    onClose={() => setOpenTerms(false)}
                    closeIcon={{
                        style: {
                            top: "2%",
                            left: "96%",
                            backgroundColor: "gray",
                            borderRadius: "50%",
                            height: "20px",
                            width: "20px",
                            padding: "5px",
                            fontSize: "12px"
                        },
                        name: "close"
                    }}
                >
                    <Modal.Header>
                        <Header style={{ marginTop: "1%" }} as="h2" align="center">
                            Terms and Conditions
                        </Header>
                    </Modal.Header>
                    <Modal.Content
                        align="justify"
                        scrolling
                    >
                        <p style={{ align: "justify" }}>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin porttitor
                            diam ligula, non luctus tellus finibus vel. In faucibus, leo vitae
                            ullamcorper suscipit, arcu eros laoreet ex, eu vestibulum lacus eros in
                            felis. In ultrices sed nisi in cursus. Praesent venenatis orci et sem
                            pulvinar semper. Nullam vestibulum, neque vitae suscipit volutpat,
                            libero metus interdum elit, imperdiet aliquam arcu nunc ac mauris. Morbi
                            dolor ligula, ornare at orci non, luctus hendrerit felis. Ut eu
                            convallis velit. Curabitur massa ex, cursus id rutrum id, viverra a
                            elit. Phasellus commodo massa nec nulla dignissim dictum. Proin nec
                            sapien lacus. Nam sit amet lectus erat. Ut quis malesuada erat, dapibus
                            tempus massa. Vestibulum auctor massa non faucibus vehicula. Proin sit
                            amet quam ut nisi sollicitudin facilisis. Mauris quis tellus non metus
                            congue vulputate id id urna. Maecenas suscipit mauris sed leo placerat
                            aliquam. Pellentesque habitant morbi tristique senectus et netus et
                            malesuada fames ac turpis egestas. Nunc nec velit non erat efficitur
                            rhoncus non non quam. Curabitur non dictum purus. Nunc at viverra elit.
                            Vivamus aliquet lacinia viverra. Donec ullamcorper quis dui in blandit.
                            Etiam congue non nisi sit amet egestas. Nunc vehicula tortor non est
                            ultricies, ac dictum sem sollicitudin. Nunc vulputate dictum lorem in
                            gravida. Integer condimentum massa ac vestibulum dignissim. Donec quis
                            mattis tortor, eget lobortis lectus. Fusce auctor laoreet est quis
                            iaculis. Vestibulum fringilla tortor libero. Donec volutpat mi a diam
                            maximus gravida. Vestibulum eu augue ac nulla cursus porta nec a quam.
                            Nulla vel tempus metus, nec aliquet est. In eu cursus metus. Curabitur a
                            eros et felis accumsan pellentesque gravida at elit. Integer in congue
                            mi. Praesent sed imperdiet elit. Nulla in imperdiet est. Donec ipsum
                            arcu, hendrerit fermentum est nec, facilisis euismod purus. Pellentesque
                            viverra dolor nec massa pretium, vestibulum dapibus quam bibendum.
                            Quisque rhoncus leo nec erat tincidunt, quis gravida lectus porta.
                            Interdum et malesuada fames ac ante ipsum primis in faucibus. Aliquam
                            nec feugiat elit, at cursus ligula. Nullam ut posuere ante, vel
                            scelerisque nulla. Phasellus vitae finibus mi, nec tempor nibh.
                            Curabitur id dictum lorem, ut rhoncus dolor. Maecenas pellentesque
                            elementum turpis, at luctus libero faucibus id. Nullam id fringilla
                            arcu. Suspendisse dui lectus, viverra a elit sed, vulputate commodo
                            turpis. Quisque ut hendrerit lorem. Sed finibus congue tortor.
                            Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere
                            cubilia Curae Quisque eu est sed purus gravida volutpat sed ut leo. Nunc
                            maximus egestas ullamcorper. Pellentesque venenatis ac leo non
                            elementum. Aenean dictum blandit fringilla. Etiam luctus mollis diam
                            vitae bibendum. Maecenas eu nisi vel nisi maximus venenatis porttitor in
                            ipsum. Proin rhoncus volutpat mauris, eu pharetra odio dapibus non. Duis
                            rhoncus pulvinar sem, at suscipit lorem ultrices faucibus. Nullam
                            feugiat ante cursus, ultricies lacus in, luctus arcu. Praesent rhoncus
                            et leo ac ullamcorper. Sed id purus justo. Nunc cursus diam sit amet
                            metus posuere ornare. Mauris ut maximus sem, sit amet commodo mi.
                            Quisque scelerisque, ligula sit amet suscipit posuere, quam nisi
                            venenatis eros, vitae sodales mi metus a nisi. Ut sed enim diam. Donec
                            nibh urna, imperdiet eu finibus ac, volutpat vitae quam. Aliquam porta
                            enim odio, vitae imperdiet sem pharetra eu. Pellentesque sem mi, auctor
                            a sem ac, aliquet convallis lacus. Quisque lectus risus, ornare nec
                            maximus vel, interdum quis ipsum. Duis pulvinar sem felis, vitae rhoncus
                            risus vestibulum vel. Aliquam erat volutpat. Quisque enim quam,
                            fermentum at arcu at, euismod tristique ex. Vivamus sed dui accumsan,
                            mattis nibh et, maximus nunc. Etiam scelerisque, quam at sodales varius,
                            nisl orci pellentesque arcu, in eleifend justo dolor eget dolor. Nulla
                            vitae augue faucibus dolor placerat aliquam. Vestibulum malesuada varius
                            massa, eget commodo ligula congue sed. Nam at lacinia est. Fusce eget
                            augue ultrices, pellentesque nisi sed, hendrerit nunc. Etiam ut arcu
                            bibendum, pulvinar sem vitae, aliquet nunc. Integer id erat sed augue
                            viverra varius. Curabitur fringilla, libero eu eleifend ultrices, arcu
                            leo blandit tellus, vitae tristique mi enim nec purus. Sed sodales ex
                            libero, non aliquam odio pulvinar vitae. Curabitur pretium nec sapien a
                            rutrum. Cras dictum lacus in augue fermentum, vitae condimentum mi
                            feugiat. Mauris efficitur lacus nibh, sit amet vestibulum purus
                            fermentum cursus. In hac habitasse platea dictumst. Duis euismod at
                            tortor eget facilisis. Praesent et commodo risus. Suspendisse non tellus
                            aliquet, fringilla neque ut, vehicula ex. Duis vel turpis ipsum. Nulla
                            commodo quam id mollis molestie. Aliquam congue imperdiet ligula ac
                            dictum. In imperdiet diam a erat suscipit auctor. Aenean a ante a tellus
                            posuere ultrices. Pellentesque congue vehicula neque ac accumsan. Duis
                            pretium, erat quis aliquet pulvinar, felis risus accumsan est, nec
                            vestibulum nulla tellus et velit. Mauris lacinia neque eget eros feugiat
                            euismod. Phasellus vehicula lobortis tortor, eget gravida turpis
                            placerat nec. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                            Nulla pharetra ullamcorper ex ac pretium. Nullam quis sapien sed arcu
                            rhoncus ornare in vel turpis. In imperdiet a turpis et semper. Donec
                            tempor ex pharetra massa scelerisque, in congue massa pulvinar.
                            Phasellus tincidunt aliquam sem, id interdum sapien finibus ut.
                            Suspendisse vitae iaculis erat, a facilisis lorem. In sagittis magna in
                            erat sagittis, in tincidunt urna commodo. Sed tincidunt vitae erat at
                            finibus. Cras sagittis est nisi, eget placerat dui suscipit vitae.
                            Maecenas placerat nulla ac fringilla vehicula. Maecenas sed tristique
                            urna. Cras volutpat volutpat nisl eget consequat. Sed pharetra dolor ut
                            suscipit dictum. Proin lacinia sapien ut malesuada tincidunt. Vivamus
                            hendrerit viverra nisl, vel cursus quam bibendum vel. Mauris a nisi ut
                            sem imperdiet tincidunt vitae a erat. Nullam vehicula venenatis sapien,
                            quis laoreet ligula tristique nec. Nam at viverra tellus. Nunc luctus
                            odio nulla, vitae faucibus urna porttitor sed. Donec id augue eget odio
                            luctus pulvinar. Quisque auctor sagittis urna et ultricies. Sed et nisl
                            aliquet ipsum porttitor efficitur. Pellentesque elementum tortor nec
                            tempor bibendum. Vestibulum posuere lobortis leo in tristique. Donec a
                            lobortis neque. Morbi tristique elit eros, ut tincidunt urna cursus
                            quis. Nulla vulputate erat eget aliquam condimentum. Pellentesque
                            habitant morbi tristique senectus et netus et malesuada fames ac turpis
                            egestas. Aliquam varius felis velit, sit amet sodales metus luctus quis.
                            Maecenas efficitur tempor massa, et placerat tortor auctor id. Fusce nec
                            felis sit amet est commodo porttitor. Nam ultricies tempus sem a rutrum.
                            Mauris et lectus mattis, dapibus lorem ac, elementum lorem. Proin in
                            enim condimentum, varius tellus eget, interdum nisl. Maecenas fringilla
                            at felis a placerat. Morbi tristique sem sem, in pretium sapien mollis
                            sit amet. Aenean ut malesuada tortor. Cras sagittis ligula sit amet orci
                            maximus, efficitur fermentum arcu dignissim. Fusce et pellentesque
                            purus. Quisque eget hendrerit diam. Etiam nec tristique risus. Sed
                            lobortis ultricies ligula, id pellentesque enim fermentum et. Duis at
                            euismod quam, ut fringilla risus. Aliquam eget fringilla eros. Phasellus
                            ligula turpis, tempor id efficitur et, gravida a nulla. Pellentesque
                            habitant morbi tristique senectus et netus et malesuada fames ac turpis
                            egestas. Integer tincidunt auctor lorem non euismod. Fusce ut porttitor
                            dolor, et interdum turpis. Phasellus iaculis mi sed felis imperdiet, sed
                            blandit odio accumsan. Nam sit amet dui et diam dignissim molestie. Nam
                            facilisis imperdiet ante. Fusce aliquet egestas dolor ut placerat.
                            Maecenas sodales nulla purus, tincidunt sollicitudin lacus tristique in.
                            Aliquam erat volutpat. Praesent quis sodales urna, eu consequat nisi.
                            Nam sed tristique justo, sit amet rutrum dolor. In diam lorem, gravida
                            in ultrices nec, posuere a velit. Morbi vel dolor justo. Phasellus sed
                            molestie quam, a vulputate velit. Pellentesque habitant morbi tristique
                            senectus et netus et malesuada fames ac turpis egestas. Integer a
                            facilisis lectus. Ut eget suscipit eros. Sed lacus risus, ultricies id
                            efficitur sit amet, sodales quis arcu. Vestibulum sit amet odio nec est
                            facilisis gravida sed sed est. Pellentesque tempus sagittis ex, sit amet
                            aliquam lectus interdum et. Maecenas bibendum molestie lectus, eget
                            fringilla lectus suscipit semper. Nunc tristique in justo a accumsan.
                            Morbi pellentesque imperdiet pretium. Cras lacinia nibh vitae rutrum
                            malesuada. Morbi in libero tincidunt tortor vehicula maximus a sit amet
                            tellus. Quisque in ornare purus, vel viverra lacus. Quisque id erat a
                            felis condimentum accumsan. Donec ac finibus lectus. Sed accumsan
                            sollicitudin dui eget gravida. Aliquam eget fringilla ipsum. Quisque ac
                            efficitur metus, id pharetra leo. Nam pretium metus sed turpis vehicula
                            suscipit. Praesent eget diam risus. Pellentesque non dui finibus,
                            rhoncus massa at, tincidunt dui. In hac habitasse platea dictumst. Ut
                            porttitor rutrum magna elementum suscipit. Nullam pretium tempor metus,
                            mattis elementum elit auctor sed. Suspendisse auctor erat eu leo
                            aliquam, at sollicitudin nisl tristique. Sed tempor est eget diam
                            tristique interdum. Sed enim eros, euismod sed placerat sit amet,
                            bibendum cursus tortor. Aliquam erat volutpat. Sed lacinia vehicula
                            orci, nec commodo nisi blandit id. Morbi eu ullamcorper turpis. Praesent
                            accumsan, dolor vitae ornare consequat, mi nunc iaculis ante, et porta
                            sem lacus quis eros. Donec rutrum volutpat lacus, eget fermentum turpis
                            lacinia eu. Quisque felis metus, blandit ac mi vitae, ultrices eleifend
                            arcu. Cras id lacus metus. Cras molestie aliquet tortor et sagittis.
                            Curabitur elit orci, efficitur sagittis justo ac, bibendum consequat
                            mauris. Sed dapibus nisi turpis. Cras eleifend suscipit nisi, a bibendum
                            lorem. Donec nec bibendum ligula. Nunc nisi ante, congue at ultrices eu,
                            suscipit non massa. Donec ultrices tincidunt neque, ac placerat odio
                            pulvinar varius. Integer pulvinar at nisl vitae elementum. Praesent ex
                            ex, bibendum a lacinia quis, porta a enim. Suspendisse a enim metus.
                            Nunc dignissim libero ut lobortis vulputate. Vivamus posuere sapien ex,
                            nec suscipit nulla aliquet nec. Vestibulum sapien dui, rutrum sit amet
                            condimentum a, euismod vel leo. Aliquam efficitur dictum felis, eu
                            venenatis lacus egestas gravida. Maecenas ultricies, nisl in dignissim
                            pretium, sapien est efficitur justo, nec interdum velit tortor et massa.
                            Duis et urna erat. Donec aliquet sapien ipsum, vitae lacinia velit
                            blandit quis. Donec ut placerat est. Phasellus nibh orci, vehicula eget
                            semper in, ornare eu ante. Suspendisse egestas nibh sit amet malesuada
                            cursus. Praesent in auctor felis. Pellentesque quis gravida nisl. Aenean
                            molestie tellus diam, quis interdum nisl cursus ac. Ut neque magna,
                            luctus ut nibh sed, porta porta dolor. Cras sit amet lacus neque. Sed
                            eleifend lectus eget risus placerat tempor aliquam sit amet massa.
                            Suspendisse aliquet vehicula risus non tristique. Donec est dui,
                            malesuada eu nunc non, pharetra viverra nisi. Phasellus ac augue quis
                            urna bibendum sollicitudin. Donec scelerisque sapien id mi aliquam, id
                            volutpat ipsum ullamcorper. Nam venenatis mauris convallis dui sagittis,
                            sit amet placerat augue tempor.
                        </p>
                        <div className="sixteen wide column" align="center">
                            <Button
                                style={{
                                    backgroundColor: "rgb(0, 128, 43)",
                                    color: "white",
                                    width: "30%",
                                    marginTop: "50px"
                                }}
                                onClick={handleTerms}
                            >
                                I Agree
                            </Button>
                        </div>
                    </Modal.Content>
                </Modal>
            </Transition> */}



        <Transition animation="scale" duration={400} unmountOnHide={true} visible={openRoles}>
            <Modal
                open={true}
                id="multipleRoleLogin"
                onClose={() => setOpenRoles(false)}
                dimmer="inverted"
                closeIcon={{
                    style: {
                        top: "10%",
                        left: "96.6%",
                        backgroundColor: "gray",
                        borderRadius: "20px",
                        height: "20px",
                        width: "21px",
                        padding: "5px",
                        fontSize: "12px"
                    },
                    name: "close"
                }}
            >
                <div
                    className="ui active inverted dimmer"
                    style={{ display: "none" }}
                    id="login-loader"
                >
                    <div className="ui text loader">Loading</div>
                </div>
                <div className="header">
                    <h1 style={{ marginBottom: "0px" }}>Log in</h1>
                    <label style={{ fontSize: "12px", fontWeight: "500" }}>
                        Which of the following roles do you want to use to login.
                    </label>
                    <br />
                    <br />
                    <div className="ui grid" style={{ margin: "0 5px 0 5px" }}>
                        {roles.map(function(role, index) {
                            return (
                                <div
                                    className="eight wide column"
                                    style={{ padding: "1px" }}
                                    key={index}
                                >
                                    <button
                                        className="ui positive basic button"
                                        style={{ width: "100%" }}
                                        name={role.id}
                                        onClick={handleSelectRole}
                                    >
                                        {role.name}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Modal>
        </Transition>
    </Grid>
    );
}

export default withApiSso(Authentication);